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

    if (options.my_font2.length > 0) {
        doc.addFileToVFS("MyFont2.ttf", options.my_font2);
        doc.addFont("MyFont2.ttf", "myFont2","normal");
        console.log("Font 2 Added");
    }

    if (options.bold_font.length > 0) {
        doc.addFileToVFS("MyFont-Bold.ttf", options.bold_font);
        doc.addFont("MyFont-Bold.ttf", "myFont","bold");
        console.log("Bold Font Added");
    }

    if (options.bold_font2.length > 0) {
        doc.addFileToVFS("MyFont2-Bold.ttf", options.bold_font2);
        doc.addFont("MyFont2-Bold.ttf", "myFont2","bold");
        console.log("Bold Font 2 Added");
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
    ,   title_pt: null
    ,   author_pt: null
    ,   copyright_pt: 8
    ,   num_columns : 5
    ,   num_full_columns: 2
    ,   column_padding: 10
    ,   gray: 1
    ,   under_title_spacing : 20
    ,   max_clue_pt : 14
    ,   min_clue_pt : 8
    ,   grid_padding : 12
    ,   outfile : null
    ,   header_text : null
    ,   header2_text: null
    ,   header_align : 'left'
    ,   header_font : 'NunitoSans-Regular'
    ,   header_pt : '22'
    ,   header2_pt : '14'
    ,   y_align : 'bottom'
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
    
    // If options.num_columns is null, we determine it ourselves
    if (!options.num_columns || !options.num_full_columns)
    {
        if (puzdata.height >= 17) {
            options.num_columns = 5;
            options.num_full_columns = 2;
        }
        else if (puzdata.width >= 17) {
            options.num_columns = 4;
            options.num_full_columns = 1;
        }
        else {
            options.num_columns = 3;
            options.num_full_columns = 1;
        }
    }
    
    // The maximum font size of title and author
    
    var PTS_PER_IN = 72;
    var DOC_WIDTH = 8.5 * PTS_PER_IN;
    var DOC_HEIGHT = 11 * PTS_PER_IN;
    
    var margin = options.margin;
    
    var doc;
    
    
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
    var col_width = (DOC_WIDTH - 2 * margin - (options.num_columns -1 ) * options.column_padding) / options.num_columns;
    
    // The grid is under all but the first few columns
    var grid_width = DOC_WIDTH - 2 * margin - options.num_full_columns * (col_width + options.column_padding);
    var grid_height = (grid_width / puzdata.width) * puzdata.height;
    // x and y position of grid
    var grid_xpos = DOC_WIDTH - margin - grid_width;
    var grid_ypos = DOC_HEIGHT - margin - grid_height - options.copyright_pt;
    
    // Loop through and write to PDF if we find a good fit
    // Find an appropriate font size
    var clue_pt = options.max_clue_pt;
    var finding_font = true;
    var column_clue_padding = [];
    var line_padding = clue_pt*0.02;
    var clue_padding = clue_pt * 0.4;

    while (finding_font)
    {
        doc = new jsPDF('portrait','pt','letter');
        doc.setFont(options.header_font,"normal");
        doc.setFontSize(clue_pt);

        var num_margin = doc.getTextWidth('99');
        var num_xpos = margin + num_margin;
        var line_margin = 1.5*doc.getTextWidth(' ');
        var line_xpos = num_xpos + line_margin;     
        var line_ypos = margin + options.header_pt + options.under_title_spacing + clue_pt;
        var my_column = 0;
        var clue_arrays = [across_clues, down_clues];
        var clues_in_column = 0;
        var lines_in_column = 0;


        for (var k=0; k<clue_arrays.length; k++) {
            var clues = clue_arrays[k];
            for (var i=0; i<clues.length; i++) {
                var clue = clues[i];
                // check to see if we need to wrap
                var max_line_ypos;
                if (my_column < options.num_full_columns) {
                    max_line_ypos = DOC_HEIGHT - margin - options.copyright_pt;
                } else {
                    max_line_ypos = grid_ypos - options.grid_padding;
                } 
                
                // Split our clue
                var lines = doc.splitTextToSize(clue,col_width-(num_margin+line_margin));
                
                if ((line_ypos + ((lines.length - 1) * (clue_pt + line_padding)))> max_line_ypos) {
                    // move to new column
                    column_clue_padding[my_column] = ((max_line_ypos - (margin + options.header_pt + options.under_title_spacing)) - ((lines_in_column) * (clue_pt + line_padding)))/(clues_in_column-1);
                    my_column += 1;
                    num_xpos = margin + num_margin + my_column * (col_width + options.column_padding);
                    line_xpos = num_xpos + line_margin;
                    line_ypos = margin + options.header_pt + options.under_title_spacing + clue_pt;
                    clues_in_column = 0;
                    lines_in_column = 0;
                }
                
                for (var j=0; j<lines.length; j++)
                {
                    var line = lines[j];
                    lines_in_column++;

                    // don't allow first line in a column to be blank
                    if ((line_ypos == margin + options.header_pt + options.under_title_spacing + clue_pt) && !line) {
                        line_ypos -= (clue_pt + clue_padding + line_padding);
                        lines_in_column--;
                        clues_in_column--;
                    }

                    // Set the font to bold for the title
                    if (i==0 && j==0) {
                        //doc.setFontSize(clue_pt)
                        //doc.setFont('helvetica','bold');
                        //doc.text(line_xpos+(col_width/2),line_ypos,line,{align: 'center'});
                        line_ypos += clue_pt + line_padding + clue_padding;
                        clues_in_column++;
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

        column_clue_padding[my_column] = ((max_line_ypos - (margin + options.header_pt + options.under_title_spacing)) - ((lines_in_column) * (clue_pt + line_padding)))/(clues_in_column-1);
        
        // let's not let the font get ridiculously tiny
        if (clue_pt < options.min_clue_pt)
        {
            if (clue_padding > clue_pt * 0.3)
            {
                clue_padding -= clue_pt *.01;
            } else {
            finding_font = false;
            }
        }
                    
        // if clues won't fit, shrink the clue
        else if (my_column > (options.num_columns - 1))
        {
            clue_pt -= 0.2;
            clue_padding = clue_pt * 0.4;
        }  

        // if last column's line padding is too big, try to readjust
        else if ((column_clue_padding[my_column] > 1.3*column_clue_padding[my_column-1]) && (clue_padding < (.6*clue_pt))) {
            clue_padding += .2;
        }

                

        else
        {   
            finding_font = false;
        }
    }

    // write found grid

    doc = new jsPDF('portrait','pt','letter');
    doc.setFont(options.header_font,"normal");
    doc.setFontSize(clue_pt);

    var num_margin = doc.getTextWidth('99');
    var num_xpos = margin + num_margin;
    var line_margin = 1.5*doc.getTextWidth(' ');
    var line_xpos = num_xpos + line_margin;  
    var line_ypos = margin + options.header_pt + options.under_title_spacing + clue_pt;
    var my_column = 0;
    var num_arrays = [across_nums,down_nums];
    var clue_arrays = [across_clues, down_clues];
    var clue_padding = column_clue_padding[0];

    for (var k=0; k<clue_arrays.length; k++) {
        var clues = clue_arrays[k];
        var nums = num_arrays[k];
        for (var i=0; i<clues.length; i++) {
            var clue = clues[i];
            var num = nums[i];
   
            // check to see if we need to wrap
            var max_line_ypos;
            if (my_column < options.num_full_columns) {
                max_line_ypos = DOC_HEIGHT - margin - options.copyright_pt;
            } else {
                max_line_ypos = grid_ypos - options.grid_padding;
            } 
            
            // Split our clue
            var lines = doc.splitTextToSize(clue,col_width-(num_margin + line_margin));
            
            if ((line_ypos + ((lines.length - 1) * (clue_pt + line_padding)))> max_line_ypos+.001) {
                // move to new column
                my_column += 1;
                num_xpos = margin + num_margin + my_column * (col_width + options.column_padding);
                line_xpos = num_xpos + line_margin;
                line_ypos = margin + options.header_pt + options.under_title_spacing + clue_pt;
                clue_padding = column_clue_padding[my_column]; 

                // if the padding is ridiculous, no vertical justification
                if (clue_padding > 2.5*clue_pt) {
                    clue_padding = .5*clue_pt;
                }

            }

            for (var j=0; j<lines.length; j++)
            {
                var line = lines[j];

                // don't allow first line in a column to be blank
                if ((line_ypos == margin + options.header_pt + options.under_title_spacing + clue_pt) && !line) {
                    line_ypos -= (clue_pt + clue_padding + line_padding);
                    lines_in_column--;
                    clues_in_column--;
                }

                if (my_column >= options.num_full_columns) {
                    line_ypos += (grid_height + options.grid_padding);
                }


                // Set the font to bold for the title
                if (i==0 && j==0) {
                    doc.setFontSize(clue_pt)
                    doc.setFont(options.header_font,'bold');
                    doc.text(line_xpos-(num_margin + line_margin)+(col_width/2),line_ypos,line,{align: 'center'});
                    line_ypos += clue_pt + line_padding + clue_padding;
                    doc.setFont(options.header_font,'normal');
                    doc.text(num_xpos,line_ypos,num, null, null, "right");
                } else {
                    
                    if (j==0) {                             
                        doc.setFont(options.header_font,'normal');
                        doc.text(num_xpos,line_ypos,num, null, null, "right");
                    }

                    doc.setFont(options.header_font,'normal'); 
                    doc.text(line_xpos,line_ypos,line);
                    line_ypos += clue_pt + line_padding;
                }

                if (my_column >= options.num_full_columns) {
                    line_ypos -= (grid_height + options.grid_padding);
                }

                
            }

            line_ypos += clue_padding;
        }
    }
    
    
    /* Render header */
    
    var title_xpos = margin;
    var title_ypos = margin;
    var xalign = options.header_align;
    var baseline = options.y_align;
    var title = options.header_text;

    //title
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
    
    doc.text(title_xpos,title_ypos,title,{align: xalign, baseline: baseline});

    
    //right-header
    var author_xpos = DOC_WIDTH - margin;
    var author_ypos = margin;
    var author = options.header2_text;

    if (!options.header2_text) {
        author = puzdata.author;
    }

    doc.setFontSize(options.header2_pt);

    if (baseline == 'alphabetic' || baseline == 'middle') {
        author_ypos = title_ypos;
    }     

    doc.text(author_xpos,author_ypos,author,{align: 'right', baseline: baseline});

    doc.setFont(options.header_font,'normal');
    
    /* Render copyright */
    var copyright_xpos = DOC_WIDTH - margin;
    var copyright_ypos = (margin + options.header_pt + options.under_title_spacing + grid_height + options.copyright_pt + 3);  //DOC_HEIGHT - margin;
    doc.setFontSize(options.copyright_pt);
    doc.text(copyright_xpos,copyright_ypos,puzdata.copyright,null,null,'right');
    
    /* Draw grid */
    
    var grid_options = {
        grid_letters : false
    ,   grid_numbers : true
    ,   x0: grid_xpos
    ,   y0: (margin + options.header_pt + options.under_title_spacing + 3)//grid_ypos
    ,   cell_size: grid_width / puzdata.width
    ,   gray : options.gray
    };
    draw_crossword_grid(doc,puzdata,grid_options);
    
    if (options.output=='preview') {
        PDFObject.embed(doc.output("bloburl"), "#example1");
    } else if (options.output=='download') {
        doc.save(options.outfile); 
    }
}