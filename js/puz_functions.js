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
    ,   gray : 0.4
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
        var filled_string = (filled ? 'F' : '');
        var number_offset = cell_size/20;
        var number_size = cell_size/3.5;
        //var letter_size = cell_size/1.5;
        var letter_length = letter.length;
        var letter_size = cell_size/(1.5 + 0.5 * (letter_length - 1));
        var letter_pct_down = .9;
        doc.setFillColor(options.gray.toString());
        doc.setDrawColor(options.gray.toString());
        // Create an unfilled square first
        doc.rect(x1,y1,cell_size,cell_size);
        if (filled) {
            doc.rect(x1,y1,cell_size,cell_size,'F');
        }
        //numbers
        doc.setFontSize(number_size);
        doc.text(x1+number_offset,y1+number_size,number);
        
        // letters
        doc.setFontSize(letter_size);
        doc.text(x1+cell_size/2,y1+cell_size * letter_pct_down,letter,null,null,'center');
        
        // circles
        if (circle) {
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
        margin: 20
    ,   grid_size : 360
    ,   email : ''
    ,   address : ''
    ,   header_pt : 10
    ,   grid_padding: 20
    ,   footer_pt: 8
    ,   clue_width : 250
    ,   entry_left_padding: 150
    ,   clue_entry_pt : 10
    ,   outfile: 'test.pdf'
    ,   gray: 0.6
    ,   font: 'NunitoSans-Regular'
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
    var usable_height = DOC_HEIGHT - 2 * margin - options.footer_pt;
    var font = options.font;

    var doc = new jsPDF('portrait','pt','letter');
    doc.setFont(font);
    
    function print_headers(doc,headers,pt,margin) {
        // print headers; return where the next line would be
        var x0 = margin;
        var y0 = margin;
        var header_padding = pt/3;
        doc.setFontSize(pt);
        for (var i=0;i<headers.length;i++) {
            doc.text(x0,y0,headers[i]);
            y0 += pt + header_padding;
        }
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
    if (puzdata.width >= 17)
    {
        headers.push(puzdata.title);
    }
    headers.push(puzdata.author);
    var address_arr = options.address.split('\n');
    headers = headers.concat(address_arr);
    headers.push(options.email);
    headers.push('');
    headers.push('Word count: ' + puzdata.nbrClues.toString());
    var y0 = print_headers(doc,headers,options.header_pt,margin);
    
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
    };
    draw_crossword_grid(doc,puzdata,first_page_options);
    print_page_num(doc,options.footer_pt,margin,DOC_HEIGHT,1);
    
   
    /** Remaining pages: clues and entries **/
    // Set up two arrays: one of clues and one of entries
    var clues = [];
    var entries = [];
    
    // Across
    clues.push('ACROSS'); entries.push('');
    for (var i=0; i<puzdata.acrossSqNbrs.length; i++) {
        var num = puzdata.acrossSqNbrs[i].toString();
        var clue = puzdata.across_clues[num];
        var entry = puzdata.across_entries[num];
        clues.push(num + ' ' + clue); entries.push(entry);
    }
    // Down
    clues.push('DOWN'); entries.push('');
    for (var i=0; i<puzdata.downSqNbrs.length; i++) {
        var num = puzdata.downSqNbrs[i].toString();
        var clue = puzdata.down_clues[num];
        var entry = puzdata.down_entries[num];
        clues.push(num + ' ' + clue); entries.push(entry);
    }
    
    var page_num = 2;
    doc.setFontSize(options.clue_entry_pt);
    headers = [puzdata.author];
    
    // new page
    doc.addPage();
    print_page_num(doc,options.footer_pt,margin,DOC_HEIGHT,page_num);
    var clue_ypos = print_headers(doc,headers,options.header_pt,margin);
    clue_ypos += options.clue_entry_pt;
    var clue_xpos = margin;
    var entry_xpos = margin + options.clue_width + options.entry_left_padding;
    var entry_ypos = clue_ypos;
    
    for (var i=0;i<clues.length;i++) {
        var clue = clues[i];
        var entry = entries[i];
        var lines = doc.splitTextToSize(clue,options.clue_width);
        // check that the clue fits; if not, make a new page
        if (clue_ypos + lines.length * options.clue_entry_pt + options.footer_pt + margin > DOC_HEIGHT) {
            doc.addPage();
            page_num += 1;
            print_page_num(doc,options.footer_pt,margin,DOC_HEIGHT,page_num);
            clue_ypos = print_headers(doc,headers,options.header_pt,margin);
            clue_ypos += options.clue_entry_pt;
            entry_ypos = clue_ypos;
        }
        // print the clue
        for (var j=0; j<lines.length;j++) {
            doc.setFontSize(options.clue_entry_pt).text(clue_xpos,clue_ypos,lines[j]);
            clue_ypos += options.clue_entry_pt;
        }
        // print the entry
        doc.setFontSize(options.clue_entry_pt).text(entry_xpos,entry_ypos,entry);
        
        // adjust the coordinates (double-spacing
        clue_ypos += options.clue_entry_pt;
        entry_ypos = clue_ypos;
    }
    
    doc.save(options.outfile); 
}
