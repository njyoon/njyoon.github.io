// Parts of this code from Crossword Nexus
// (c) 2016 Alex Boisvert
// licensed under MIT license
// https://opensource.org/licenses/MIT

// Remainder of this code (c) Nam Jin Yoon
// licensed under MIT license
// https://opensource.org/licenses/MIT

window.jsPDF = window.jspdf.jsPDF;


/** Draw a crossword grid (requires jsPDF) **/


function draw_crossword_grid(doc,puzdata,options)
{
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
    function draw_square(doc,x1,y1,cell_size,number,letter,filled,circle) {
        var number_offset = cell_size/18;
        var number_size = cell_size*options.number_pct/100;
        var letter_size = cell_size/(100/options.letter_pct);
        var letter_pct_down = .88;

        doc.setFillColor(options.gray.toString());
        doc.setDrawColor(options.gray.toString());

        // Create an unfilled square first

        if (filled) {
            doc.rect(x1,y1,cell_size,cell_size,'F');
        } else if (circle && options.shade) {
            doc.setFillColor('0.85');
            doc.rect(x1,y1,cell_size,cell_size,'F');
            doc.setFillColor(options.gray.toString());
        }

        doc.rect(x1,y1,cell_size,cell_size);
            
        
        //numbers
        doc.setFontSize(number_size);
        doc.text(x1+number_offset,y1+number_size,number);
        
        //letters 

        /* rebus option
        if (options.rebus.length > 0) {
            if (row==options.rebus[0] && column==options.rebus[1]) {
                letter = options.rebus[2];
                if (letter.length > 1) {
                    letter_size = cell_size/(1.2 + 0.75 * (letter.length - 1));              
                    letter_pct_down -= .03 * letter.length
                }
            } 
        }
        */

            doc.setFontSize(letter_size);
            doc.text(x1+cell_size/2,y1+cell_size * letter_pct_down,letter,{align:'center'});
        
        // circles
        if (circle && !options.shade) {
            doc.circle(x1+cell_size/2,y1+cell_size/2,cell_size/2);
        }
    }
    
    var width = puzdata.width;
    var height = puzdata.height;
    for (var i=0; i<height; i++) {
        var y_pos = options.y0 + i * cell_size;
        for (var j=0; j<width; j++) {
            var x_pos = options.x0 + j * cell_size;
            var grid_index = j + i * width;
            var filled = false;
            
            // Letters
            var letter = puzdata.solution.charAt(grid_index);
            if (letter == '.') {
                filled = true;
                letter = '';
            }
            // Numbers
            if (!options.grid_letters) {letter = '';}
            var number = puzdata.sqNbrs[grid_index];
            if (!options.grid_numbers) {number = '';}
            
            // Circle
            var circle = puzdata.circles[grid_index];
            draw_square(doc,x_pos,y_pos,cell_size,number,letter,filled,circle);
        }
    }
}

/** Create a NYT submission (requires jsPDF) **/
function puzdata_to_nyt(puzdata,options)
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
    if (puzdata.width >= 20)
    {
        headers.push(puzdata.title);
    }
    var address_arr = options.address.split('\n');
    headers = headers.concat(address_arr);
    headers.push('');

    if (options.wc==1) {
    
        headers.push('Word count: ' + puzdata.nbrClues.toString());
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
    ,   cell_size: grid_size / puzdata.width
    ,   gray : options['gray']
    ,   letter_pct : options['letter_pct']
    ,   number_pct : options['number_pct']
    ,   shade : options.shade
    };

    doc.setFont(options.grid_font,"normal");
    draw_crossword_grid(doc,puzdata,first_page_options);
    doc.setFont(options.header_font,"normal");

    if (options.pages==1) {
        print_page_num(doc,options.footer_pt,margin,DOC_HEIGHT,1);
    }


    // Draw border
    if (options.border_width > options.line_width) {
        doc.setLineWidth(options.border_width);
        doc.rect(grid_xpos-options.border_width/2,grid_ypos-options.border_width/2,grid_size+options.border_width,(grid_size*puzdata.height/puzdata.width)+options.border_width);
    }
    
   
    /** Remaining pages: clues and entries **/
    // Set up three arrays: one of clue numbers, one of clues, and one of entries
    var clueNums = [];
    var clues = [];
    var entries = [];
    headers = [];
    
    // Across
    clues.push('ACROSS'); entries.push(''); clueNums.push('');
    for (var i=0; i<puzdata.acrossSqNbrs.length; i++) {
        var num = puzdata.acrossSqNbrs[i].toString();
        var clue = puzdata.across_clues[num];
        var entry = puzdata.across_entries[num];
        clues.push(clue); entries.push(entry); clueNums.push(num);
    }
    // Down
    clues.push('DOWN'); entries.push(''); clueNums.push('');
    for (var i=0; i<puzdata.downSqNbrs.length; i++) {
        var num = puzdata.downSqNbrs[i].toString();
        var clue = puzdata.down_clues[num];
        var entry = puzdata.down_entries[num];
        clues.push(clue); entries.push(entry); clueNums.push(num);
    }
    
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

function puzdata_to_pdf(puzdata,options) {
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
    
    // If columns are not manually selected, choose number
    if (options.columns=="auto")
    {
        if (puzdata.height >= 17) {
            options.num_columns = 6;
            options.num_full_columns = 2;
        } else if (puzdata.height < 14 && puzdata.height >= 9) {
            options.num_columns = 3;
            options.num_full_columns = 1;
        } else if (puzdata.height < 10) {
            options.num_columns = 2;
            options.num_full_columns = 0;
        } else {
            options.num_columns = 5;
            options.num_full_columns = 2;
        }
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
        //console.log("Font Added");
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
        title = puzdata.title;
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
            author = puzdata.author.trim();
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
    var across_nums = [];
    var across_clues = [];
    for (var i=0; i<puzdata.acrossSqNbrs.length; i++) {
        var num = puzdata.acrossSqNbrs[i].toString();
        var clue = puzdata.across_clues[num];
        
        if (i==0) {
            across_nums.push(num);
            across_clues.push('ACROSS\n' + clue);            
        }
        else {
            across_nums.push(num);
            across_clues.push(clue);
        }
    }
    // For space between clue lists
    across_clues.push('');
    across_nums.push('');
    
    var down_nums = [];
    var down_clues = [];
    for (var i=0; i<puzdata.downSqNbrs.length; i++) {
        var num = puzdata.downSqNbrs[i].toString();
        var clue = puzdata.down_clues[num];
        if (i==0) {
            down_nums.push(num);
            down_clues.push('DOWN\n' + clue);
        }
        else {
            down_nums.push(num);
            down_clues.push(clue);
        }
    }
    
    // size of columns
    var col_width = (DOC_WIDTH - 2 * side_margin - (options.num_columns -1 ) * options.column_padding) / options.num_columns;
    
    // The grid is under all but the first few columns
    var grid_width = DOC_WIDTH - 2 * side_margin - options.num_full_columns * (col_width + options.column_padding);

    // If only two columns, grid size is limited
    if (options.num_columns == 2) {
        grid_width = 30*puzdata.width;
    }

    var grid_height = (grid_width / puzdata.width) * puzdata.height;
    // x and y position of grid
    var grid_xpos = DOC_WIDTH - side_margin - grid_width;

    // If only two columns, grid size is limited
    if (options.num_columns == 2) {
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

        var num_margin = doc.getTextWidth('99');
        var num_xpos = side_margin + num_margin;
        var line_margin = 1.5*doc.getTextWidth(' ');
        var line_xpos = num_xpos + line_margin;     
        var line_ypos = margin + header_height + clue_pt;
        var my_column = 0;
        var clue_arrays = [across_clues, down_clues];
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
                
                // Split our clue
                var lines = doc.splitTextToSize(clue,col_width-(num_margin+line_margin));

                                
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

    var num_margin = doc.getTextWidth('99');
    var num_xpos = side_margin + num_margin;
    var line_margin = 1.5*doc.getTextWidth(' ');
    var line_xpos = num_xpos + line_margin;  
    var line_ypos = margin + header_height + clue_pt;
    var my_column = 0;
    var num_arrays = [across_nums,down_nums];
    var clue_arrays = [across_clues, down_clues];
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
            
            // Split our clue
            var lines = doc.splitTextToSize(clue,col_width-(num_margin + line_margin));
            
            if (!manual_spacing && (((line_ypos + ((lines.length - 1) * (clue_pt + line_padding)))> max_line_ypos+.001) || (!lines[0] && skip_column))) {
                // move to new column
                //console.log(line_ypos);
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
                        doc.setFont(options.clue_font,options.number_style);
                        doc.text(num_xpos,line_ypos,num, null, null, "right");
                    }

                    doc.setFont(options.clue_font,'normal'); 
                    doc.text(line_xpos,line_ypos,line);
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
  
    

    /* Render copyright */

    if (options.copyright){
        var copyright_text;

        if (options.copyright_text) {
            copyright_text = options.copyright_text;
        } else {
            copyright_text = puzdata.copyright;
        }

        var copyright_xpos = grid_xpos + grid_width;   
        var copyright_ypos;
        if (options.grid_placement=='top') {
            copyright_ypos = (margin + header_height + grid_height + options.border_width + options.copyright_pt + 3);  
        } else {
            copyright_ypos = DOC_HEIGHT - margin;
        }
        doc.setFont(options.grid_font,'bold');
        doc.setFontSize(options.copyright_pt);
        doc.setTextColor(80);
        doc.text(copyright_xpos,copyright_ypos,copyright_text,null,null,'right');
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
    ,   cell_size: grid_width / puzdata.width
    ,   gray : options.gray
    ,   number_pct : options.number_pct
    ,   shade : options.shade
    };

    doc.setFont(options.grid_font,'bold');
    doc.setLineWidth(options.line_width);
    draw_crossword_grid(doc,puzdata,grid_options);

    // Draw border
    if (options.border_width > options.line_width) {
        doc.setLineWidth(options.border_width);
        doc.rect(grid_xpos-options.border_width/2,(margin + header_height + 3)-options.border_width/2,grid_width+options.border_width,(grid_width*puzdata.height/puzdata.width)+options.border_width);
    }
    
    if (options.output=='preview') {
        PDFObject.embed(doc.output("bloburl"), "#example1");
    } else if (options.output=='download') {
        doc.save(options.outfile); 
    }
}