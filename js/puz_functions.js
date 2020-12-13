// (c) 2016 Alex Boisvert
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
        console.log("Font Added");
    }
    if (options.bold_font.length > 0) {
        doc.addFileToVFS("MyFont-Bold.ttf", options.bold_font);
        doc.addFont("MyFont-Bold.ttf", "myFont","bold");
        console.log("Bold Font Added");
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
    //,   grid_size: grid_size
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
