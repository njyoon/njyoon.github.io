// Parts of this code from Crossword Nexus
// (c) 2016 Alex Boisvert
// licensed under MIT license
// https://opensource.org/licenses/MIT

// Remainder of this code (c) Nam Jin Yoon
// licensed under MIT license
// https://opensource.org/licenses/MIT

window.jsPDF = window.jspdf.jsPDF;

/* function to strip HTML tags */
/* via https://stackoverflow.com/a/5002618 */
function strip_html(s) {
    var div = document.createElement("div");
    div.innerHTML = s;
    var text = div.textContent || div.innerText || "";
    return text;
}

/** Helper functions for splitting text with tags **/
function traverseTree(htmlDoc, agg=[]) {
    if (htmlDoc.nodeName == '#text') {
        // if we have a text element we can add it
        var thisTag = htmlDoc.parentNode.tagName;
        var is_bold = (thisTag == 'B');
        var is_italic = (thisTag == 'I');
        var textContent = htmlDoc.textContent;
        textContent.replace(/\s+/g, ' ');
        htmlDoc.textContent.split('').forEach(char => {
            agg.push({'char': char, 'is_bold': is_bold, 'is_italic': is_italic});
        });
    }
    for (var i=0; i<htmlDoc.childNodes.length; i++) {
        agg = traverseTree(htmlDoc.childNodes[i], agg=agg);
    }
    return agg;
}

/* Print a line of text that may be bolded or italicized */
const printCharacters = (doc, textObject, startY, startX, fontSize, font) => {
    if (!textObject.length) {
        return;
    }

    if (typeof(textObject) == 'string') {
        //var myText = ASCIIFolder.foldReplacing(textObject, '*')
        var myText = textObject;
        doc.text(startX, startY, myText);
    }
    else {
        textObject.map(row => {
            if (row.is_bold) {
                doc.setFont(font, 'bold');
            }
            else if (row.is_italic) {
                doc.setFont(font, 'italic');
            }
            else {
                doc.setFont(font, 'normal');
            }

            // Some characters don't render properly in PDFs
            // TODO: replace them using the mapping above
            var mychar = row.char;
            //mychar = ASCIIFolder.foldReplacing(mychar, '*');
            doc.text(mychar, startX, startY);
            startX = startX + doc.getStringUnitWidth(row.char) * fontSize;
            doc.setFont(font, 'normal');
        });
    }
};

/* helper function for bold and italic clues */
function split_text_to_size_bi(clue, col_width, doc, font, has_header=false) {
    // get the clue with HTML stripped out
    var el = document.createElement( 'html' );
    el.innerHTML = clue;
    var clean_clue = el.innerText;

    // split the clue
    var lines1 = doc.splitTextToSize(clean_clue, col_width);

    // if there's no <B> or <I> in the clue just return lines1
    if (clue.toUpperCase().indexOf('<B') == -1 && clue.toUpperCase().indexOf('<I') == -1) {
        return lines1;
    }

    // Check if there's a "header"
    // if so, track the header, and separate out the clue
    var header_line = null;
    if (has_header) {
        var clue_split = clue.split('\n');
        header_line = clue_split[0];
        clue = clue_split.slice(1).join('\n');
        el.innerHTML = clue;
        clean_clue = el.innerText;
    }

    // parse the clue into a tree
    var myClueArr = [];
    var parser = new DOMParser();
    var htmlDoc = parser.parseFromString(clue, 'text/html');
    var split_clue = traverseTree(htmlDoc);

    // Make a new "lines1" with all bold splits
    doc.setFont(font, 'bold');
    lines1 = doc.splitTextToSize(clean_clue, col_width);
    doc.setFont(font, 'normal');

    // split this like we did the "lines1"
    var lines = [];
    var ctr = 0;
    // Characters to skip
    const SPLIT_CHARS = new Set([' ', '\t', '\n']);
    lines1.forEach(line => {
        var thisLine = [];
        var myLen = line.length;
        for (var i=0; i < myLen; i++) {
            thisLine.push(split_clue[ctr++]);
        }
        if (split_clue[ctr]) {
            if (SPLIT_CHARS.has(split_clue[ctr].char)) {
                ctr = ctr + 1;
            }
        }
        lines.push(thisLine);
    });
    if (has_header) {
        lines = [header_line].concat(lines);
    }
    return lines;
}

/** Draw a crossword grid (requires jsPDF) **/
function draw_crossword_grid(doc, xw, options)
{
    /*
    *  doc is a jsPDF instance
    * xw is a JSCrossword instance
    */

    // options are as below
    var DEFAULT_OPTIONS = {
        grid_letters : true
    ,   grid_numbers : true
    ,   x0: 20
    ,   y0: 20
    ,   cell_size: 24
    ,   grid_size: 360
    ,   gray : 1
    ,   letter_pct : 62
    ,   number_pct: 30
    ,   shade: false
    ,   rebus : []
    ,   line_width: 0.7
    ,   bar_width: 2
    };

    for (var key in DEFAULT_OPTIONS) {
        if (!DEFAULT_OPTIONS.hasOwnProperty(key)) continue;
        if (!options.hasOwnProperty(key))
        {
            options[key] = DEFAULT_OPTIONS[key];
        }
    }

    var PTS_TO_IN = 72;
    var cell_size = options.cell_size;

    /** Function to draw a square **/
    function draw_square(doc,x1,y1,cell_size,number,letter,filled,cell, barsOnly=false) {

      if (!barsOnly) {
        // thank you https://stackoverflow.com/a/5624139
        function hexToRgb(hex) {
            hex = hex || '#FFFFFF';
            // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
            var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
            hex = hex.replace(shorthandRegex, function(m, r, g, b) {
                return r + r + g + g + b + b;
            });


            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        }

        var MIN_NUMBER_SIZE = 5.5;

        var filled_string = (filled ? 'F' : '');
        var number_offset = cell_size/20;
        var number_size = cell_size/3.5 < MIN_NUMBER_SIZE ? MIN_NUMBER_SIZE : cell_size/3.5;
        //var letter_size = cell_size/1.5;
        var letter_length = letter.length;
        var letter_size = cell_size/(1.5 + 0.5 * (letter_length - 1));
        var letter_pct_down = 4/5;

        // for "clue" cells we set the background and text color
        doc.setTextColor(0, 0, 0);
        if (cell.clue) {
          //doc.setTextColor(255, 255, 255);
          cell['background-color'] = '#CCCCCC';
        }

        if (cell['background-color'] || (cell['background-shape'] && options.shade)) {
            var filled_string = 'F';
            var rgb = hexToRgb(cell['background-color'] || '#D9D9D9');
            doc.setFillColor(rgb.r, rgb.g, rgb.b);
            doc.setDrawColor(options.gray.toString());
            // Draw one filled square and then one unfilled
            doc.rect(x1, y1, cell_size, cell_size, filled_string);
            doc.rect(x1, y1, cell_size, cell_size);
        }
        else {
            doc.setFillColor(options.gray.toString());
            doc.setDrawColor(options.gray.toString());
            // draw the bounding box for all squares -- even "clue" squares
            if (true) {
                doc.rect(x1, y1, cell_size, cell_size);
                if (filled_string) {
                    doc.rect(x1, y1, cell_size, cell_size, filled_string);
                }
            }
        }
        //numbers
        //doc.setFontType('normal');
        doc.setFontSize(number_size);
        doc.text(x1+number_offset,y1+number_size,number);

        // top-right numbers
        var top_right_number = cell.top_right_number ? cell.top_right_number : '';
        doc.setFontSize(number_size);
        doc.text(x1 + cell_size - number_offset, y1 + number_size, top_right_number, null, null, 'right');

        // letters
        //doc.setFontType('normal');
        doc.setFontSize(letter_size);
        doc.text(x1+cell_size/2,y1+cell_size * letter_pct_down,letter,null,null,'center');

        // circles
        if (cell['background-shape'] && !options.shade) {
            doc.circle(x1+cell_size/2,y1+cell_size/2,cell_size/2);
        }
      }
      // bars
      cell.bar = {
        top: cell['top-bar']
      , left: cell['left-bar']
      , right: cell['right-bar']
      , bottom: cell['bottom-bar']
      };
      if (cell.bar) {
          var bar = cell.bar;
          var bar_start = {
              top: [x1, y1],
              left: [x1, y1],
              right: [x1 + cell_size, y1 + cell_size],
              bottom: [x1 + cell_size, y1 + cell_size]
          };
          var bar_end = {
              top: [x1 + cell_size, y1],
              left: [x1, y1 + cell_size],
              right: [x1 + cell_size, y1],
              bottom: [x1, y1 + cell_size]
          };
          for (var key in bar) {
              if (bar.hasOwnProperty(key)) {
                  if (bar[key]) {
                      //console.log(options.bar_width);
                      doc.setLineWidth(options.bar_width);
                      doc.line(bar_start[key][0], bar_start[key][1], bar_end[key][0], bar_end[key][1]);
                      doc.setLineWidth(options.line_width);
                  }
              }
          }
      }
      // Reset the text color, if necessary
      doc.setTextColor(0, 0, 0);
    }

    var width = xw.metadata.width;
    var height = xw.metadata.height;
    xw.cells.forEach(function(c) {
        // don't draw a square if we have a void
        if (c.is_void || (c.type === 'block' && c['background-color'] === '#FFFFFF')) {
          return;
        }
        var x_pos = options.x0 + c.x * cell_size;
        var y_pos = options.y0 + c.y * cell_size;
        // letter
        var letter = c.solution || '';
        if (!options.grid_letters) {letter = '';}
        letter = letter || c.letter || '';
        var filled = c.type == 'block';
        // number
        var number = c['number'] || '';
        if (!options.grid_numbers) {number = '';}
        // circle
        var circle = c['background-shape'] == 'circle';
        // draw the square unless it's a void
        // or a block with a white background
        draw_square(doc,x_pos,y_pos,cell_size,number,letter,filled,c);
    });

    // Draw just the bars afterward
    // This is necessary because we may have overwritten bars earlier
    xw.cells.forEach(function(c) {
        var x_pos = options.x0 + c.x * cell_size;
        var y_pos = options.y0 + c.y * cell_size;
        draw_square(doc, x_pos ,y_pos, cell_size, '', '', false, c, true);
    });
}

/** Create a NYT submission (requires jsPDF) **/
function puzdata_to_nyt(xw, options)
{
    var DEFAULT_OPTIONS = {
        margin: 72
    ,   grid_size : 360
    ,   address : ''
    ,   header_pt : 12
    ,   grid_padding: 72
    ,   footer_pt: 12
    ,   clue_width : 252
    ,   entry_left_padding: 108
    ,   clue_entry_pt : 12
    ,   outfile: 'test.pdf'
    ,   gray: 1
    ,   header_font: 'NunitoSans-Regular'
    ,   grid_font: 'NunitoSans-Regular'
    ,   clue_font: 'NunitoSans-Regular'
    ,   wc: 0
    ,   pages: 0
    ,   coconstructor: ''
    ,   output: 'preview'
    ,   letter_pct: 62
    ,   number_pct: 30
    ,   line_width: 0.4
    ,   border_width: 0.4
    ,   clue_spacing: 1.2
    ,   heading_style: 'bold'
    ,   number_style: 'bold'
    ,   shade: false
    ,   my_font: ''
    };



    for (var key in DEFAULT_OPTIONS) {
        if (!DEFAULT_OPTIONS.hasOwnProperty(key)) continue;
        if (!options.hasOwnProperty(key))
        {
            options[key] = DEFAULT_OPTIONS[key];
        }
    }


    var PTS_PER_IN = 72;
    var DOC_WIDTH = 8.5 * PTS_PER_IN;
    var DOC_HEIGHT = 11 * PTS_PER_IN;

    var margin = options.margin;

    var doc = new jsPDF('portrait','pt','letter');


    if (options.my_font.length > 0) {
        doc.addFileToVFS("MyFont.ttf", options.my_font);
        doc.addFont("MyFont.ttf", "myFont","normal");
        //console.log("Font Added");
    }

    if (options.my_font2.length > 0) {
        doc.addFileToVFS("MyFont2.ttf", options.my_font2);
        doc.addFont("MyFont2.ttf", "myFont2","normal");
        //console.log("Font 2 Added");
    }

    if (options.bold_font.length > 0) {
        doc.addFileToVFS("MyFont-Bold.ttf", options.bold_font);
        doc.addFont("MyFont-Bold.ttf", "myFont","bold");
        //console.log("Bold Font Added");
    }

    if (options.bold_font2.length > 0) {
        doc.addFileToVFS("MyFont2-Bold.ttf", options.bold_font2);
        doc.addFont("MyFont2-Bold.ttf", "myFont2","bold");
        //console.log("Bold Font 2 Added");
    }

    doc.setFont(options.header_font,"normal");
    doc.setLineWidth(options.line_width);


    function print_headers(doc,headers,pt,xMargin,yMargin) {
        // print headers; return where the next line would be
        var x0 = xMargin;
        var y0 = yMargin+pt;
        var header_padding = pt*0.2;
        doc.setFontSize(pt);
        for (var i=0;i<headers.length;i++) {
            doc.text(x0,y0,headers[i]);
            y0 += pt + header_padding;
        }

        y0 -= (pt + header_padding);
        return y0;
    }

    function print_page_num(doc,pt,margin,doc_height,num) {
        var x0 = margin;
        var y0 = doc_height - margin;
        doc.setFontSize(pt)
            .text(x0,y0,'Page ' + num.toString());
    }

    /** First page: filled grid **/
    // Print the headers
    var headers = [];
    // only include the title if it's a Sunday
    if (xw.metadata.width >= 20)
    {
        headers.push(xw.metadata.title);
    }
    var address_arr = options.address.split('\n');
    headers = headers.concat(address_arr);
    headers.push('');

    if (options.wc==1) {

        headers.push('Word count: ' + xw.words.length.toString());
    }

    var y0 = print_headers(doc,headers,options.header_pt,margin,margin);

    // Add coconstructor info if needed
    if (options.coconstructor.length > 0) {
        var headers2 = [];
        var coconstructor_arr = options.coconstructor.split('\n');
        headers2 = headers2.concat(coconstructor_arr);
        headers2.push('');
        print_headers(doc,headers2,options.header_pt,margin/2 + DOC_WIDTH/2,margin);
    }


    // Print the filled grid
    var grid_ypos = y0 + options.grid_padding;
    // adjust the the grid size if we don't have enough space
    var grid_size = options.grid_size;
    if (grid_size > DOC_HEIGHT - grid_ypos - margin - options.footer_pt) {
        grid_size = DOC_HEIGHT - grid_ypos - margin - options.footer_pt;
    }
    // position x so that the grid is centered
    var grid_xpos = (DOC_WIDTH - grid_size)/2;
    var first_page_options = {
        grid_letters : true
    ,   grid_numbers : true
    ,   x0: grid_xpos
    ,   y0: grid_ypos
    ,   cell_size: grid_size / xw.metadata.width
    ,   gray : options['gray']
    ,   letter_pct : options['letter_pct']
    ,   number_pct : options['number_pct']
    ,   shade : options.shade
    };

    doc.setFont(options.grid_font,"normal");
    draw_crossword_grid(doc,xw,first_page_options);
    doc.setFont(options.header_font,"normal");

    if (options.pages==1) {
        print_page_num(doc,options.footer_pt,margin,DOC_HEIGHT,1);
    }


    // Draw border
    if (options.border_width > options.line_width) {
        doc.setLineWidth(options.border_width);
        doc.rect(grid_xpos-options.border_width/2,grid_ypos-options.border_width/2,grid_size+options.border_width,(grid_size*xw.metadata.height/xw.metadata.width)+options.border_width);
    }


    /** Remaining pages: clues and entries **/
    // Set up three arrays: one of clue numbers, one of clues, and one of entries
    var clueNums = [];
    var clues = [];
    var entries = [];
    headers = [];

    xw.clues.forEach(function(clue_list) {
        clues.push(`${clue_list.title.toUpperCase()}`); entries.push(''); clueNums.push('');
        clue_list.clue.forEach(function(my_clue) {
            var num = my_clue['number'];
            var clue = my_clue['text'];
            const wordid_to_word = xw.get_entry_mapping();
            var entry = wordid_to_word[my_clue['word']];
            clues.push(clue); entries.push(entry); clueNums.push(num);
        });
    });

    var page_num = 2;
    doc.setFontSize(options.clue_entry_pt);

    // new page
    doc.addPage();
    if (options.pages==1) {
        print_page_num(doc,options.footer_pt,margin,DOC_HEIGHT,page_num);
    }
    var clue_ypos = print_headers(doc,headers,options.header_pt,margin,margin);
    clue_ypos += options.clue_entry_pt;
    var num_xpos = margin + 21;
    var clue_xpos = margin + 30;
    var entry_xpos = margin + options.clue_width + options.entry_left_padding;
    var entry_ypos = clue_ypos;

    for (var i=0;i<clues.length;i++) {
        var clue = clues[i];
        var entry = entries[i];
        var clueNum = clueNums[i];
        var lines = doc.splitTextToSize(clue,options.clue_width);
        // check that the clue fits; if not, make a new page
        if ((clue_ypos + lines.length * options.clue_entry_pt + options.footer_pt + margin > DOC_HEIGHT) || ((clue == 'ACROSS' || clue == 'DOWN') && (clue_ypos + 6 * lines.length * options.clue_entry_pt + options.footer_pt + margin > DOC_HEIGHT) )) {
            doc.addPage();
            doc.setFont(options.header_font,"normal");
            page_num += 1;
            if (options.pages==1) {
                print_page_num(doc,options.footer_pt,margin,DOC_HEIGHT,page_num);
            }
            clue_ypos = print_headers(doc,headers,options.header_pt,margin,margin);
            clue_ypos += options.clue_entry_pt;
            doc.setFont(options.clue_font,"normal");
            entry_ypos = clue_ypos;
        }
        // print the clue
        for (var j=0; j<lines.length;j++) {
            if (lines[j]=='ACROSS' || lines[j]=='DOWN') {
                if (lines[j]=='DOWN') {
                    clue_ypos += options.clue_entry_pt;
                }

                doc.setFont(options.clue_font,options.heading_style);
                doc.setFontSize(options.clue_entry_pt).text(margin,clue_ypos,lines[j]);
                doc.setFont(options.clue_font,"normal");
            } else{
                doc.setFontSize(options.clue_entry_pt).text(clue_xpos,clue_ypos,lines[j]);
            }
            clue_ypos += options.clue_entry_pt*1.2;
        }
        // print the entry
        doc.setFont(options.clue_font,options.number_style);
        doc.setFontSize(options.clue_entry_pt).text(num_xpos,entry_ypos,clueNum, null, null, "right");
        doc.setFont(options.clue_font,"normal");
        doc.setFontSize(options.clue_entry_pt).text(entry_xpos,entry_ypos,entry);

        // adjust the coordinates (double-spacing)
        clue_ypos += options.clue_entry_pt*options.clue_spacing;
        entry_ypos = clue_ypos;
    }

    if (options.output=='preview') {
        PDFObject.embed(doc.output("bloburl"), "#example1");
    } else if (options.output=='download') {
        doc.save(options.outfile);
    }
}

/** Create a PDF (requires jsPDF) **/

function puzdata_to_pdf(xw, options) {
    var DEFAULT_OPTIONS = {
        margin: 20
    ,   side_margin: 20
    ,   bottom_margin: 140
    ,   copyright_pt: 8
    ,   columns: "auto"
    ,   num_columns : null
    ,   num_full_columns: null
    ,   column_padding: 10
    ,   gray: 1
    ,   under_title_spacing : 20
    ,   max_clue_pt : 14
    ,   min_clue_pt : 8
    ,   grid_padding : 12
    ,   outfile : null
    ,   header_text : null
    ,   header2_text : null
    ,   subheader_text : null
    ,   header_align : 'left'
    ,   header2_align: 'right'
    ,   subheader_align: 'left'
    ,   header_font : 'RobotoCondensed'
    ,   clue_font : 'RobotoCondensed'
    ,   grid_font : 'NunitoSans-Regular'
    ,   header_pt : 20
    ,   header2_pt : 16
    ,   subheader_pt : 14
    ,   y_align : 'top'
    ,   right_header : false
    ,   subheader : false
    ,   line_width : 0.4
    ,   border_width : 0.4
    ,   subheader_mt : 4
    ,   shade: true
    ,   letter_pct: 62
    ,   number_pct: 30
    ,   copyright: true
    ,   copyright_text: null
    ,   header_width: 67
    ,   clue_spacing: 0.3
    ,   grid_placement: 'top'
    ,   solution: false
    ,   logo: null
    ,   logoX: 36
    ,   logoY: 36
    ,   logoS: 1.0
    ,   header_indent: 0
    ,   subheader_indent: 0
    };

    for (var key in DEFAULT_OPTIONS) {
        if (!DEFAULT_OPTIONS.hasOwnProperty(key)) continue;
        if (!options.hasOwnProperty(key))
        {
            options[key] = DEFAULT_OPTIONS[key];
        }
    }

    // If there's no filename, just call it puz.pdf
    if (!options.outfile) options.outfile = 'puz.pdf';

    // length of clues
    var clue_length = xw.clues.map(x=>x.clue).flat().map(x=>x.text).join('').length;

    // If columns are not manually selected, choose number
    if (options.columns=="auto")
    {
        var xw_height = xw.metadata.height;
        var xw_width = xw.metadata.width;
        if (xw_height > 2 * xw_width) {
            options.num_columns = 5;
            options.num_full_columns = 3;
        }
        // handle puzzles with very few words
        else if (clue_length <= 1000) {
            options.num_columns = Math.max(Math.ceil(clue_length/400), 2);
            options.num_full_columns = 0;
        }
        else if (xw_height >= 17) {
            options.num_columns = 6;
            options.num_full_columns = 2;
        }
        else if (xw_width > 17) {
            options.num_columns = 4;
            options.num_full_columns = 1;
        }
        else if (clue_length >= 1600) {
            options.num_columns = 5;
            options.num_full_columns = 2;
        }
        else {
            options.num_columns = 3;
            options.num_full_columns = 1;
        }
        //console.log(options.num_columns, options.num_full_columns);
    } else {
        if (options.columns == "2") {
            options.num_columns = 2;
            options.num_full_columns = 0;
        } else if (options.columns == "3") {
            options.num_columns = 3;
            options.num_full_columns = 1;
        } else if (options.columns == "4") {
            options.num_columns = 4;
            options.num_full_columns = 1;
        } else if (options.columns == "6") {
            options.num_columns = 6;
            options.num_full_columns = 2;
        } else if (options.columns == "new") {
            var numCols = Math.min(Math.ceil(clue_length/800), 5);
            options.num_columns = numCols;
            options.num_full_columns = numCols;
        } else {
            options.num_columns = 5;
            options.num_full_columns = 2;
        }
    }

    // The maximum font size of title and author

    var PTS_PER_IN = 72;
    var DOC_WIDTH = 8.5 * PTS_PER_IN;
    var DOC_HEIGHT = 11 * PTS_PER_IN;

    var margin = options.margin;
    var side_margin = options.side_margin;
    var bottom_margin = options.bottom_margin;
    var header_height = options.under_title_spacing;

    var doc;



    /* Calculate header */

    var title_xpos = side_margin + options.header_indent;
    var title_ypos = margin;
    var xalign = options.header_align;
    var baseline = options.y_align;
    var title = options.header_text;

    //title
    doc = new jsPDF('portrait','pt','letter');

    if (options.my_font.length > 0) {
        doc.addFileToVFS("MyFont.ttf", options.my_font);
        doc.addFont("MyFont.ttf", "myFont","bold");
        doc.addFont("MyFont.ttf", "myFont","italic");
        console.log(`Font {options.my_font} Added`);
    }

    doc.setFontSize(options.header_pt);
    doc.setFont(options.header_font,'bold');

    if (options.header_align=='center') {
        title_xpos = DOC_WIDTH/2;
    }

    if (baseline == 'alphabetic') {
        title_ypos += options.header_pt;
    } else if (baseline == 'middle') {
        title_ypos += options.header_pt/2;
    }

    if (!options.header_text) {
        title = xw.metadata.title;
    }

    if (!options.copyright) {
        options.copyright_pt = 0;
    }

    var title_width = doc.getTextWidth(title);
    var title_right_margin = doc.getTextWidth('  ');
    var max_width = DOC_WIDTH - 2*side_margin;

    if (options.right_header) {
        max_width = options.header_width*max_width;
    }

    title = doc.splitTextToSize(title, max_width);
    if (title) {
        header_height += 1.15*(title.length)*(options.header_pt);
    }

    //right-header

    var author_xpos = DOC_WIDTH - side_margin;
    var author_ypos = margin;
    var author = options.header2_text;
    var author_align = options.header2_align;

    if (options.right_header) {

        max_width = DOC_WIDTH - (2*side_margin + doc.getTextWidth(title[0]) + title_right_margin);

        if (!options.header2_text) {
            author = xw.metadata.author.trim();
        }

        doc.setFontSize(options.header2_pt);
        author = doc.splitTextToSize(author, max_width);

        if ((author.length)*(options.header2_pt) > (title.length)*(options.header_pt)) {
            header_height += (author.length)*(options.header2_pt) - (title.length)*(options.header_pt);
        }

        if (baseline == 'alphabetic') {
            author_ypos = title_ypos;
        }

        if (baseline == 'middle') {
            author_ypos = margin + options.header_pt*title.length/2;
        }

        if (author_align == 'left') {
            author_xpos = title_width + side_margin + title_right_margin;
        }

    }

    //subheader

    var subheader_xpos = side_margin + options.subheader_indent;
    var subheader_ypos = title_ypos + 1.15*options.header_pt*(title.length-1) + options.subheader_pt + options.subheader_mt;
    var subheader_text = options.subheader_text;
    var subheader_align = options.subheader_align;

    if (options.subheader && subheader_text) {

        header_height += options.subheader_mt

        max_width = DOC_WIDTH - 2*side_margin;

        doc.setFontSize(options.subheader_pt);
        subheader_text = doc.splitTextToSize(subheader_text, max_width);

        if (subheader_align == 'left') {
            header_height += (subheader_text.length)*(options.subheader_pt);
            if (baseline=='top') {
                subheader_ypos = title_ypos + options.header_pt*title.length + options.subheader_mt;
            }
        } else if (subheader_align == 'center') {
            header_height += (subheader_text.length)*(options.subheader_pt);
            subheader_xpos = DOC_WIDTH/2;
            if (baseline=='top') {
                subheader_ypos = title_ypos + options.header_pt*title.length + options.subheader_mt;
            }
        } else if (subheader_align == 'right') {
            subheader_xpos = DOC_WIDTH - side_margin;
            subheader_ypos = author_ypos + 1.15*options.header2_pt*(author.length-1) + options.subheader_pt + options.subheader_mt;
            if (baseline=='top') {
                subheader_ypos = author_ypos + 1.15*options.header2_pt*(author.length-1) + options.header2_pt + options.subheader_mt;
                if ((author.length)*(options.header2_pt) < (title.length)*(options.header_pt)) {
                    header_height += (subheader_text.length)*(options.subheader_pt) - ((title.length)*(options.header_pt)-(author.length)*(options.header2_pt))
                }
            } else {
                header_height += (subheader_text.length)*(options.subheader_pt);
            }
        }
    }


    // create the clue strings and clue arrays
    var clue_arrays = [];
    var num_arrays = [];
    for (j=0; j < xw.clues.length; j++) {
        var these_clues = [];
        var these_nums = [];
        for (i=0; i< xw.clues[j]['clue'].length; i++) {
            var e = xw.clues[j]['clue'][i];
            var num = e.number;
            var clue = e.text;

            var this_clue_string = clue;
            if (i==0) {
                these_clues.push(xw.clues[j].title + '\n' + this_clue_string);
            }
            else {
                these_clues.push(this_clue_string);
            }
            these_nums.push(num);
        }
        // add a space between the clue lists, assuming we're not at the end
        if (j < xw.clues.length - 1) {
            these_clues.push('');
            these_nums.push('');
        }
        clue_arrays.push(these_clues);
        num_arrays.push(these_nums);
    }

    // size of columns
    var col_width = (DOC_WIDTH - 2 * side_margin - (options.num_columns -1 ) * options.column_padding) / options.num_columns;

    // The grid is under all but the first few columns
    var grid_width = DOC_WIDTH - 2 * side_margin - options.num_full_columns * (col_width + options.column_padding);

    // If only two columns, grid size is limited
    if (options.columns == "new" || options.num_columns == 2) {
        grid_width = DOC_WIDTH - 2 * side_margin;
    }

    // We change the grid width and height if num_full_columns == 0
    // This is because we don't want it to take up too much space
    if (options.num_full_columns === 0) {
        // set the height to be (about) half of the available area
        grid_height = DOC_HEIGHT * 4/9;
        grid_width = (grid_height / xw_height) * xw_width;
        // however! if this is bigger than allowable, re-calibrate
        if (grid_width > (DOC_WIDTH - 2 * margin)) {
            grid_width = (DOC_WIDTH - 2 * margin);
            grid_height = (grid_width / xw_width) * xw_height;
        }
    }

    var grid_height = (grid_width / xw.metadata.width) * xw.metadata.height;
    // x and y position of grid
    var grid_xpos = DOC_WIDTH - side_margin - grid_width;

    if (options.grid_placement == "left") {
        grid_xpos = side_margin;
    }

    // If only two columns, grid size is limited
    if (options.num_columns == 2 || options.columns == "new") {
        grid_xpos = (DOC_WIDTH-grid_width)/2;
    }
    var grid_ypos = DOC_HEIGHT - bottom_margin - grid_height - options.copyright_pt;

    // Loop through and write to PDF if we find a good fit
    // Find an appropriate font size
    var clue_pt = options.max_clue_pt;
    var finding_font = true;
    var column_clue_padding = [];
    var line_padding = clue_pt*0;
    var clue_padding = clue_pt * options.clue_spacing;

    var manual_spacing = false;
    var skip_column = false;
    var emergency_button = 0;

    var spacing_strictness = 1.2;

    if (options.num_full_columns == 0) {
        manual_spacing = true;
    }

    while (finding_font && !manual_spacing)
    {
        doc = new jsPDF('portrait','pt','letter');
        doc.setFont(options.clue_font,"normal");
        doc.setFontSize(clue_pt);

        // Print the clues
        // We set the margin to be the maximum length of the clue numbers
        var max_clue_num_length = xw.clues.map(x=>x.clue).flat().map(x=>x.number).map(x => x.length).reduce((a, b) => Math.max(a, b));
        var num_margin = doc.getTextWidth('9'.repeat(max_clue_num_length));
        var num_xpos = side_margin + num_margin;
        var line_margin = 1.5*doc.getTextWidth(' ');
        var line_xpos = num_xpos + line_margin;
        var line_ypos = margin + header_height + clue_pt;
        var my_column = 0;
        var clues_in_column = 0;
        var lines_in_column = 0;
        var heading_pt = 0;
        skip_column = false;


        for (var k=0; k<clue_arrays.length; k++) {
            var clues = clue_arrays[k];
            for (var i=0; i<clues.length; i++) {
                var clue = clues[i];
                // check to see if we need to wrap
                var max_line_ypos;
                if (my_column < options.num_full_columns) {
                    max_line_ypos = DOC_HEIGHT - bottom_margin - options.copyright_pt;
                } else {
                    max_line_ypos = grid_ypos - options.grid_padding;
                }

                if (options.grid_placement == "left") {
                    if (my_column < (options.num_columns - options.num_full_columns)) {
                        max_line_ypos = grid_ypos - options.grid_padding;
                    } else {
                        max_line_ypos = DOC_HEIGHT - bottom_margin - options.copyright_pt;
                    }
                }

                // Split our clue
                var lines = split_text_to_size_bi(clue, col_width - (num_margin + line_margin), doc, options.clue_font, i==0);

                if ((line_ypos + ((lines.length - 1) * (clue_pt + line_padding)))> max_line_ypos) {
                    // move to new column
                    column_clue_padding[my_column] = ((max_line_ypos - (margin + header_height + heading_pt)) - ((lines_in_column) * (clue_pt + line_padding)))/(clues_in_column-1);
                    my_column += 1;
                    num_xpos = side_margin + num_margin + my_column * (col_width + options.column_padding);
                    line_xpos = num_xpos + line_margin;
                    line_ypos = margin + header_height + clue_pt;
                    clues_in_column = 0;
                    lines_in_column = 0;
                    heading_pt = 0;
                } else if (!lines[0] && (line_ypos + (4 * (clue_pt + line_padding)))> max_line_ypos) {
                    skip_column=true;
                    column_clue_padding[my_column] = ((max_line_ypos - (margin + header_height + heading_pt)) - ((lines_in_column) * (clue_pt + line_padding)))/(clues_in_column-1);
                    my_column += 1;
                    num_xpos = side_margin + num_margin + my_column * (col_width + options.column_padding);
                    line_xpos = num_xpos + line_margin;
                    line_ypos = margin + header_height + clue_pt;
                    clues_in_column = 0;
                    lines_in_column = 0;
                    heading_pt = 0;
                }



                for (var j=0; j<lines.length; j++)
                {
                    var line = lines[j];
                    lines_in_column++;

                    // don't allow first line in a column to be blank
                    if ((line_ypos == margin + header_height + clue_pt) && !line) {
                        line_ypos -= (clue_pt + clue_padding + line_padding);
                        lines_in_column--;
                        clues_in_column--;
                    }

                    // Set the font to bold for the title
                    if (i==0 && j==0) {
                        //doc.setFontSize(clue_pt)
                        //doc.setFont('helvetica','bold');
                        //doc.text(line_xpos+(col_width/2),line_ypos,line,{align: 'center'});
                        heading_pt += 2;
                        line_ypos += clue_pt + line_padding + clue_padding + 2;
                        clues_in_column ++;
                        //doc.setFontSize(clue_pt);
                    } else {
                        //doc.setFont('helvetica','normal');
                        // print the text
                        //doc.text(line_xpos,line_ypos,line);
                        // set the y position for the next line
                        line_ypos += clue_pt + line_padding;
                    }

                }

                clues_in_column++;
                line_ypos += clue_padding;
            }
        }

        column_clue_padding[my_column] = ((max_line_ypos - (margin + header_height)) - ((lines_in_column) * (clue_pt + line_padding)))/(clues_in_column-1);


        // if clues won't fit, shrink the clue
        if (my_column > (options.num_columns - 1))
        {
            //console.log("decreasing font size");
            if (my_column > options.num_columns) {
                clue_pt -= clue_pt/10;
            } else {
                clue_pt -= clue_pt/50;
            }
            clue_padding = clue_pt * options.clue_spacing;
        }

        // if clues don't take up all columns, increase clue size
        else if (my_column < options.num_columns -1) {
            //console.log("increasing font size");
            clue_pt += clue_pt/10;
            clue_padding = clue_pt * options.clue_spacing;
        }

        //if the last column's clues are too spaced out, increase padding
        else if ((column_clue_padding[my_column] > spacing_strictness*column_clue_padding[my_column-1]) && (clue_padding < 2*clue_pt)) {
            //console.log("increasing clue padding");
            clue_padding += clue_pt/20;
            emergency_button++;
            if (emergency_button > 20){
                //console.log("struggle bussing");
                //console.log("last column padding:" + column_clue_padding[my_column] + " // second-to-last column padding:" + column_clue_padding[my_column-1]);
                clue_pt = options.max_clue_pt;
                clue_padding = clue_pt * options.clue_spacing;
                spacing_strictness += 0.1;
                emergency_button = 0;
            }
        }

        else
        {
            //console.log("last column padding:" + column_clue_padding[my_column] + " // second-to-last column padding:" + column_clue_padding[my_column-1]);
            //console.log(my_column + " vs " + (options.num_columns - 1));
            finding_font = false;
        }
    }

    // write found grid

    doc = new jsPDF('portrait','pt','letter');
    doc.setFont(options.clue_font,"normal");
    doc.setFontSize(clue_pt);

    /* Render logo if there is one*/
    if (options.logo) {
        const imgProps = doc.getImageProperties(options.logo);
        doc.addImage(options.logo, options.logoX, options.logoY,options.logoS*imgProps.width,options.logoS*imgProps.height);
    }

    var max_clue_num_length = xw.clues.map(x=>x.clue).flat().map(x=>x.number).map(x => x.length).reduce((a, b) => Math.max(a, b));
    var num_margin = doc.getTextWidth('9'.repeat(max_clue_num_length));
    var num_xpos = side_margin + num_margin;
    var line_margin = 1.5*doc.getTextWidth(' ');
    var line_xpos = num_xpos + line_margin;
    var line_ypos = margin + header_height + clue_pt;
    var my_column = 0;
    var clue_padding = column_clue_padding[0];
    //console.log(column_clue_padding);
    //console.log(skip_column);
    var heading_pt = 0;

    if (manual_spacing) {
        clue_padding = clue_pt * options.clue_spacing;
        clue_pt = options.max_clue_pt;
    }

    for (var k=0; k<clue_arrays.length; k++) {
        var clues = clue_arrays[k];
        var nums = num_arrays[k];
        for (var i=0; i<clues.length; i++) {
            var clue = clues[i];
            var num = nums[i];

            // check to see if we need to wrap
            var max_line_ypos;
            if (my_column < options.num_full_columns) {
                max_line_ypos = DOC_HEIGHT - bottom_margin - options.copyright_pt;
            } else {
                max_line_ypos = grid_ypos - options.grid_padding;
            }

            if (options.grid_placement == "left") {
                if (my_column < (options.num_columns - options.num_full_columns)) {
                    max_line_ypos = grid_ypos - options.grid_padding;
                } else {
                    max_line_ypos = DOC_HEIGHT - bottom_margin - options.copyright_pt;
                }
            }

            // Split our clue
            var lines = split_text_to_size_bi(clue, col_width - (num_margin + line_margin), doc, options.clue_font, i==0);

            if (!manual_spacing && (((line_ypos + ((lines.length - 1) * (clue_pt + line_padding)))> max_line_ypos+.001) || (!lines[0] && skip_column))) {
                // move to new column
                //console.log(max_line_ypos);
                my_column += 1;
                num_xpos = side_margin + num_margin + my_column * (col_width + options.column_padding);
                line_xpos = num_xpos + line_margin;
                line_ypos = margin + header_height + clue_pt;
                clue_padding = column_clue_padding[my_column];
                heading_pt = 0;

                // if the padding is ridiculous, no vertical justification
                if (clue_padding > 2.5*clue_pt) {
                    clue_padding = .5*clue_pt;
                }

            }

            for (var j=0; j<lines.length; j++)
            {
                var line = lines[j];

                // don't allow first line in a column to be blank
                if ((line_ypos == margin + header_height + clue_pt) && !line) {
                    line_ypos -= (clue_pt + clue_padding + line_padding);
                    lines_in_column--;
                    clues_in_column--;
                }

                if (my_column >= options.num_full_columns && options.grid_placement == 'top') {
                    line_ypos += (grid_height + options.grid_padding);
                }


                // Set the font to heading_style for the title
                if (i==0 && j==0) {
                    if (manual_spacing && k==1) {
                        my_column += 1;
                        num_xpos = side_margin + num_margin + my_column * (col_width + options.column_padding);
                        line_xpos = num_xpos + line_margin;
                        line_ypos = margin + header_height + clue_pt;

                        if (my_column >= options.num_full_columns && options.grid_placement == 'top') {
                            line_ypos += (grid_height + options.grid_padding);
                        }
                    }

                    heading_pt = 2;
                    line_ypos += heading_pt;
                    doc.setFontSize(clue_pt+heading_pt);
                    doc.setFont(options.clue_font,options.heading_style);
                    doc.text(line_xpos-(num_margin + line_margin)+(col_width/2),line_ypos,line,{align: 'center'});
                    line_ypos += clue_pt + line_padding + clue_padding;
                    doc.setFontSize(clue_pt);
                    doc.setFont(options.clue_font,options.number_style);
                    doc.text(num_xpos,line_ypos,num, null, null, "right");
                } else {

                    if (j==0) {
                        // when j == 0 we print the number
                        doc.setFont(options.clue_font,options.number_style);
                        doc.text(num_xpos,line_ypos,num, null, null, "right");
                    }
                    // Print the clue
                    doc.setFont(options.clue_font,'normal');
                    //doc.text(line_xpos,line_ypos,line);
                    printCharacters(doc, line, line_ypos, line_xpos, clue_pt, options.clue_font);
                    line_ypos += clue_pt + line_padding;
                }

                if (my_column >= options.num_full_columns && options.grid_placement == 'top') {
                    line_ypos -= (grid_height + options.grid_padding);
                }


            }

            line_ypos += clue_padding;
        }
    }

    /* Render header */
    if (options.my_font.length > 0) {
        doc.addFileToVFS("MyFont.ttf", options.my_font);
        doc.addFont("MyFont.ttf", "myFont","bold");
        //console.log("Font Added");
    }
    doc.setFontSize(options.header_pt);
    doc.setFont(options.header_font,'bold');
    doc.text(title_xpos,title_ypos,title,{align: xalign, baseline: baseline});

    /* Render right-header */

    if (options.right_header) {
        doc.setFontSize(options.header2_pt);
        doc.text(author_xpos,author_ypos,author,{align: author_align, baseline: baseline});
    }

    /* Render subheader */

    if (options.subheader && subheader_text) {
        doc.setFontSize(options.subheader_pt);
        doc.text(subheader_xpos,subheader_ypos,subheader_text,{align: subheader_align, baseline: baseline});
    }

    /* Add headers to new page */

    if (options.columns == "new") {
        doc.addPage();

        /* Render logo if there is one*/
        if (options.logo) {
            const imgProps = doc.getImageProperties(options.logo);
            doc.addImage(options.logo, options.logoX, options.logoY,options.logoS*imgProps.width,options.logoS*imgProps.height);
        }

        /* Render header */
        if (options.my_font.length > 0) {
            doc.addFileToVFS("MyFont.ttf", options.my_font);
            doc.addFont("MyFont.ttf", "myFont","bold");
            //console.log("Font Added");
        }
        doc.setFontSize(options.header_pt);
        doc.setFont(options.header_font,'bold');
        doc.text(title_xpos,title_ypos,title,{align: xalign, baseline: baseline});

        /* Render right-header */

        if (options.right_header) {
            doc.setFontSize(options.header2_pt);
            doc.text(author_xpos,author_ypos,author,{align: author_align, baseline: baseline});
        }

        /* Render subheader */

        if (options.subheader && subheader_text) {
            doc.setFontSize(options.subheader_pt);
            doc.text(subheader_xpos,subheader_ypos,subheader_text,{align: subheader_align, baseline: baseline});
        }



    }


    /* Render copyright */

    if (options.copyright){
        var copyright_text;

        if (options.copyright_text) {
            copyright_text = options.copyright_text;
        } else {
            copyright_text = xw.metadata.copyright;
        }

        doc.setFont(options.grid_font,'bold');
        doc.setFontSize(options.copyright_pt);
        doc.setTextColor(80);

        copyright_text = doc.splitTextToSize(copyright_text, grid_width);

        var copyright_xpos;

        if (options.grid_placement=='left'){
        copyright_xpos = (side_margin + grid_width);
        } else {
        copyright_xpos = grid_xpos + grid_width;
        }

        var copyright_ypos;
        if (options.grid_placement=='top') {
            copyright_ypos = (margin + header_height + grid_height + options.border_width + options.copyright_pt + 3);
        } else {
            copyright_ypos = (grid_ypos + grid_height + options.border_width + options.copyright_pt + 3);
            // copyright_ypos = DOC_HEIGHT + options.border_width - margin;
        }
        if (copyright_text.length > 1) {
            doc.text(grid_xpos,copyright_ypos,copyright_text,null,null,'left');
        } else {
            doc.text(copyright_xpos,copyright_ypos,copyright_text,null,null,'right');
        }

        doc.setTextColor(0);

    }

    /* Draw grid */

    if (options.grid_placement=='top') {
        grid_ypos = (margin + header_height + 3);
    }

    var grid_options = {
        grid_letters : options.solution
    ,   grid_numbers : true
    ,   x0: grid_xpos
    ,   y0: grid_ypos
    ,   cell_size: grid_width / xw.metadata.width
    ,   gray : options.gray
    ,   number_pct : options.number_pct
    ,   shade : options.shade
    };

    doc.setFont(options.grid_font,'bold');
    doc.setLineWidth(options.line_width);
    draw_crossword_grid(doc,xw,grid_options);

    // Draw border
    if (options.border_width > options.line_width) {
        doc.setLineWidth(options.border_width);
        doc.rect(grid_xpos-options.border_width/2,grid_ypos-options.border_width/2,grid_width+options.border_width,(grid_width*xw.metadata.height/xw.metadata.width)+options.border_width);
    }

    if (options.columns == "new") {
        doc.movePage(2,1);
    }

    if (options.output=='preview') {
        PDFObject.embed(doc.output("bloburl"), "#example1");
    } else if (options.output=='download') {
        doc.save(options.outfile);
    }
}
