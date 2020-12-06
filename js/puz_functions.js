// (c) 2016 Alex Boisvert
// licensed under MIT license
// https://opensource.org/licenses/MIT

/** Create a list of clues **/
function puz_to_clues(parsedPuz, elt) 
{
  var text = '';
  text += 'ACROSS\n';
  for (var cluenum in parsedPuz.across_clues) {
    var clue = parsedPuz.across_clues[cluenum];
    text += cluenum + '. ' + clue + '\n';
  }
  text += '\nDOWN\n';
  for (var cluenum1 in parsedPuz.down_clues) {
    var clue1 = parsedPuz.down_clues[cluenum1];
    text += cluenum1 + '. ' + clue1 + '\n';
  }
  elt.innerHTML = text;
}

/** Create a JPZ **/
function puz_to_jpz(parsedPuz, outname)
{
    // helper function to escape HTML
    function escapeHtml(unsafe) {
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
     }
    
    var title_esc = escapeHtml(parsedPuz.title);
    var author_esc = escapeHtml(parsedPuz.author);
    var copyright_esc = escapeHtml(parsedPuz.copyright);
    
    var i,j;
    
    var xml = `<?xml version="1.0" encoding="UTF-8"?>
<crossword-compiler-applet>
    <applet-settings height="0" hide-numbers="false" cursor-color="#FFFF00" background-color="#FFFFFF" width="0" show-alphabet="false" selected-cells-color="#C0C0C0" is-solving="true">
        <completion only-if-correct="false" friendly-submit="false" show-solution="false" cheating="10000">Congratulations, you have completed the puzzle!</completion>
        <actions graphical-buttons="false" wide-buttons="false" buttons-layout="left">
            <reveal-word label="Reveal Word"/>
            <reveal-letter label="Reveal"/>
            <check label="Check"/>
            <solution label="Solution"/>
            <pencil label="Pencil"/>
        </actions>
        <clues heading-centered="false" bold-numbers="true" selection-color="#FF0000" scroll-color="#808080" width="200" clue-indent-align="true" completed-color="#808080" gutter="5" color="#000000" hint-url-text="[?]" layout="right" font-size="12" font-family="SansSerif" right-align-numbers="true" url-color="#0000FF" period-with-numbers="false"/>
        <copyright>
            ${copyright_esc}
        </copyright>
    </applet-settings>
    <rectangular-puzzle>
        <metadata>
            <creator>${author_esc}</creator>
            <created/>
            <title>${title_esc}</title>
            <editor/>
            <rights/>
            <copyright>${copyright_esc}</copyright>
            <publisher/>
            <description/>
        </metadata>
    `;
    xml += `
    <crossword>
    <grid height="${parsedPuz.height}" one-letter-words="false" width="${parsedPuz.width}">
        <grid-look grid-line-color="#000000" font-color="#000000" number-color="#000000" pencil-color="#0000B2" hide-lines="false" italian-style="false" numbering-scheme="normal" thick-border="false" cell-size-in-pixels="25" block-color="#000000"/>
    `;
    for (i=0; i < parsedPuz.height * parsedPuz.width; i++) {
        var letter = parsedPuz.solution.charAt(i);
        var numbering = '';
        if (parsedPuz.sqNbrs[i] !== '') {
            numbering = `number="${parsedPuz.sqNbrs[i]}"`;
        }
        // Cells with circles
        var circling = '';
        if (parsedPuz.circles[i]) {
            circling = 'background-shape="circle"';
        }
        var x = i % parsedPuz.width + 1;
        var y = Math.floor(i / parsedPuz.width) + 1;
        if (letter == '.') {
            xml += `                <cell x="${x}" type="block" y="${y}"/>\n`;
        }
        else {
            xml += `                <cell solution="${letter}" x="${x}" ${numbering} y="${y}" ${circling}/>\n`;
        }
    }
    xml += `            </grid>\n`;
    
    // Words
    var word_id = 1;
    var clues_across = [];
    // across words
    for (i=0; i < parsedPuz.acrossSqNbrs.length; i++) {
        var clue_across = {};
        var clue_num = parsedPuz.acrossSqNbrs[i];
        // Find where in the grid this appears
        var index = parsedPuz.sqNbrs.indexOf(clue_num.toString());
        clue_across['cell'] = index;
        clue_across['wordid'] = word_id;
        clue_across['num'] = clue_num;
        clue_across['clue'] = parsedPuz.across_clues[clue_num.toString()];
        x = index % parsedPuz.width + 1;
        y = Math.floor(index / parsedPuz.width) + 1;
        clue_across['len'] = parsedPuz.across_entries[clue_num].length;
        xml += `            <word id="${word_id}">\n`;
        for (j=0; j < clue_across['len']; j++) {
            xml += `                <cells x="${x}" y="${y}"/>\n`;
            x += 1;
        }
        xml += `            </word>\n`;
        clues_across.push(clue_across);
        word_id += 1;
    }
    
    // down words
    var clues_down = [];
    for (i=0; i < parsedPuz.acrossSqNbrs.length; i++) {
        var clue_down = {};
        var clue_num1 = parsedPuz.downSqNbrs[i];
        // Find where in the grid this appears
        var index1 = parsedPuz.sqNbrs.indexOf(clue_num1.toString());
        clue_down['cell'] = index1;
        clue_down['wordid'] = word_id;
        clue_down['num'] = clue_num1;
        clue_down['clue'] = parsedPuz.down_clues[clue_num1.toString()];
        x = index1 % parsedPuz.width + 1;
        y = Math.floor(index1 / parsedPuz.width) + 1;
        clue_down['len'] = parsedPuz.down_entries[clue_num1].length;
        xml += `            <word id="${word_id}">\n`;
        for (j=0; j < clue_down['len']; j++) {
            xml += `                <cells x="${x}" y="${y}"/>\n`;
            y += 1;
        }
        xml += `            </word>\n`;
        clues_down.push(clue_down);
        word_id += 1;
    }
    
    // Clues
        xml += `            <clues>
                    <title>
                        <b>Across</b>
                    </title>
    `;
    for (i=0; i<clues_across.length; i++) {
        var c1 = clues_across[i];
        var my_clue1 = escapeHtml(c1['clue']);
        var cnum1 = c1['num'];
        var wordid1 = c1['wordid'];
        xml += `                <clue number="${cnum1}" word="${wordid1}">${my_clue1}</clue>\n`;
    }
    xml += `            </clues>
                <clues>
                    <title>
                        <b>Down</b>
                    </title>
    `;
    for (i=0; i<clues_down.length; i++) {
        var c2 = clues_down[i];
        var my_clue2 = escapeHtml(c2['clue']);
        var cnum2 = c2['num'];
        var wordid2 = c2['wordid'];
        xml += `                <clue number="${cnum2}" word="${wordid2}">${my_clue2}</clue>\n`;
    }
    xml += `            </clues>
            </crossword>
        </rectangular-puzzle>
    </crossword-compiler-applet>
    `;
    
    function file_download(filename,text){
        // Set up the link
        var link = document.createElement("a");
        link.setAttribute("target","_blank");
        if(Blob !== undefined) {
            var blob = new Blob([text], {type: "text/plain"});
            link.setAttribute("href", URL.createObjectURL(blob));
        } else {
            link.setAttribute("href","data:text/plain," + encodeURIComponent(text));
        }
        link.setAttribute("download",filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    file_download(outname, xml);
    
}

/** Create an HTML grid **/
function html_grid_from_puz(parsedPuz,elt)
{
    var grid = parsedPuz.grid;c
    var width = parsedPuz.width;
    var height = parsedPuz.height;
    var sqNbrs = parsedPuz.sqNbrs;
    var myHTML = '<TABLE BORDER=1 SHADE=0>\n<TR>\n';
    for (var y=0; y<height; y++)
    {
        myHTML += '<TR>\n';
        for (var x=0; x<width; x++)
        {
            var isBlack = parsedPuz.isBlack(x,y);
            var index = parsedPuz.toIndex(x,y);
            var number = sqNbrs[index];
            if (isBlack)
            {
                myHTML += "<TD WIDTH=20 HEIGHT=20 BGCOLOR='BLACK'>&nbsp;</TD>\n";
            }
            else
            {
                myHTML += "<TD WIDTH=20 HEIGHT=20 BGCOLOR='WHITE'>" + number + "</TD>\n";
            }
        }
        myHTML += '</TR>\n';
    }
    myHTML += '</TABLE>\n';
    //alert(myHTML);
    elt.innerHTML = myHTML;
}

/** Clue deduper **/
function deduper_from_puz(parsedPuz,elt)
{
    //var parsedPuz = parsePuz(filecontents);
    var arr = deduper(parsedPuz);
    elt.innerHTML = '<ul>';
    for (var i=0; i<arr.length; i++)
    {
        elt.innerHTML += '<li>' + arr[i] + '</li>';
    }
    elt.innerHTML += '</ul>';
}

function deduper(parsedPuz) {
    // All entries into single array
    var entry_arrays = {};
    entry_arrays['Across'] = parsedPuz.across_entries;
    entry_arrays['Down'] = parsedPuz.down_entries;
    var clue_arrays = {};
    clue_arrays['Across'] = parsedPuz.across_clues;
    clue_arrays['Down'] = parsedPuz.down_clues;
    var directions = ['Across','Down'];
    var dupes = new Array();
    // Go through both directions for clues
    for (var i=0; i<=1; i++)
    {
        var cluedir = directions[i];
        var clues = clue_arrays[cluedir];
        // Loop through clues
        for (var cluenum in clues)
        {
            var clue = clues[cluenum];
            // Loop through words in "clue"
            var words = clue.split(/[ -]/);
            for (var w=0; w < words.length; w++)
            {
                var word = words[w].toUpperCase();
                // Keep only alpha characters
                word = word.replace(/[^A-Za-z]+/g, "");
                // Only do this for words of length 4 or more
                if (word.length < 4) {continue;}
                // Loop through grid entries looking for a dupe
                for (var j=0; j <=1; j++)
                {
                    var worddir = directions[j];
                    var entries = entry_arrays[worddir];
                    for (var entrynum in entries)
                    {
                        var entry = entries[entrynum];
                        if (entry.match(word))
                        {
                            var dupe_string = 'The clue for ' + cluenum + '-' + cluedir + ' dupes "' + word + '" with the grid entry at ' + entrynum + '-' + worddir;
                            dupe_string += '<br />[' + clue + '] <=> ' + entry;
                            dupes.push(dupe_string);
                        }
                    }
                }
            }
        }
    }
    if (dupes.length == 0) {dupes.push('No dupes found!');}
    return dupes;
}

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
        var letter_pct_down = 4/5;
        doc.setFillColor(options.gray.toString());
        doc.setDrawColor(options.gray.toString());
        // Create an unfilled square first
        doc.rect(x1,y1,cell_size,cell_size,'');
        doc.rect(x1,y1,cell_size,cell_size,filled_string);
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

/** Create a PDF (requires jsPDF) **/

function puzdata_to_pdf(puzdata,options) {
    var DEFAULT_OPTIONS = {
        margin: 20
    ,   title_pt: null
    ,   author_pt: null
    ,   copyright_pt: 8
    ,   num_columns : null
    ,   num_full_columns: null
    ,   column_padding: 10
    ,   gray: 0.55
    ,   under_title_spacing : 20
    ,   max_clue_pt : 14
    ,   min_clue_pt : 5
    ,   grid_padding : 5
    ,   outfile : null
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
    var max_title_author_pt = Math.max(options.title_pt,options.author_pt);
    
    var PTS_PER_IN = 72;
    var DOC_WIDTH = 8.5 * PTS_PER_IN;
    var DOC_HEIGHT = 11 * PTS_PER_IN;
    
    var margin = options.margin;
    
    var doc;
    
    
    // create the clue strings and clue arrays
    var across_clues = [];
    for (var i=0; i<puzdata.acrossSqNbrs.length; i++) {
        var num = puzdata.acrossSqNbrs[i].toString();
        var clue = puzdata.across_clues[num];
        var this_clue_string = num + '. ' + clue;
        if (i==0) {
            across_clues.push('ACROSS\n' + this_clue_string);
        }
        else {
            across_clues.push(this_clue_string);
        }
    }
    // For space between clue lists
    across_clues.push('');
    
    var down_clues = [];
    for (var i=0; i<puzdata.downSqNbrs.length; i++) {
        var num = puzdata.downSqNbrs[i].toString();
        var clue = puzdata.down_clues[num];
        var this_clue_string = num + '. ' + clue;
        if (i==0) {
            down_clues.push('DOWN\n' + this_clue_string);
        }
        else {
            down_clues.push(this_clue_string);
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
    while (finding_font)
    {
        doc = new jsPDF('portrait','pt','letter');
        var clue_padding = clue_pt / 3;
        doc.setFontSize(clue_pt);
        
        // Print the clues
        var line_xpos = margin;
        var line_ypos = margin + max_title_author_pt + options.under_title_spacing + clue_pt + clue_padding;
        var my_column = 0;
        var clue_arrays = [across_clues, down_clues];
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
                var lines = doc.splitTextToSize(clue,col_width);
                
                if (line_ypos + (lines.length - 1) * (clue_pt + clue_padding) > max_line_ypos) {
                    // move to new column
                    my_column += 1;
                    line_xpos = margin + my_column * (col_width + options.column_padding);
                    line_ypos = margin + max_title_author_pt + options.under_title_spacing + clue_pt + clue_padding;
                }
                
                for (var j=0; j<lines.length; j++)
                {
                    // Set the font to bold for the title
                    if (i==0 && j==0) {
                        doc.setFontType('bold');
                    } else {
                        doc.setFontType('normal');
                    }
                    var line = lines[j];
                    // print the text
                    doc.text(line_xpos,line_ypos,line);
                    
                    // set the y position for the next line
                    line_ypos += clue_pt + clue_padding;
                }
            }
        }
        
        // let's not let the font get ridiculously tiny
        if (clue_pt == options.min_clue_pt)
        {
            finding_font = false;
        }
        else if (my_column > options.num_columns - 1)
        {
            clue_pt -= 0.1;
        }
        else
        {
            finding_font = false;
        }
    }
    
    
    /***********************/
    
    // If title_pt or author_pt are null, we determine them
    var DEFAULT_TITLE_PT = 12;
    var total_width = DOC_WIDTH - 2 * margin;
    if (!options.author_pt) options.author_pt = options.title_pt;
    if (!options.title_pt) {
        options.title_pt = DEFAULT_TITLE_PT;
        var finding_title_pt = true;
        while (finding_title_pt)
        {
            var title_author = puzdata.title + 'asdfasdf' + puzdata.author;
            doc.setFontSize(options.title_pt)
                .setFontType('bold');
            var lines = doc.splitTextToSize(title_author,DOC_WIDTH);
            if (lines.length == 1) {
                finding_title_pt = false;
            }
            else {
                options.title_pt -= 1;
            }
        }
        options.author_pt = options.title_pt;
    }
    
    
    
    /* Render title and author */
    
    var title_xpos = margin;
    var author_xpos = DOC_WIDTH - margin;
    var title_author_ypos = margin + max_title_author_pt;
    //title
    doc.setFontSize(options.title_pt);
    doc.setFontType('bold');
    doc.text(title_xpos,title_author_ypos,puzdata.title);
    
    //author
    doc.setFontSize(options.author_pt);
    doc.text(author_xpos,title_author_ypos,puzdata.author,null,null,'right');
    doc.setFontType('normal');
    
    /* Render copyright */
    var copyright_xpos = DOC_WIDTH - margin;
    var copyright_ypos = DOC_HEIGHT - margin;
    doc.setFontSize(options.copyright_pt);
    doc.text(copyright_xpos,copyright_ypos,puzdata.copyright,null,null,'right');
    
    /* Draw grid */
    
    var grid_options = {
        grid_letters : false
    ,   grid_numbers : true
    ,   x0: grid_xpos
    ,   y0: grid_ypos
    ,   cell_size: grid_width / puzdata.width
    ,   gray : options.gray
    };
    draw_crossword_grid(doc,puzdata,grid_options);
    
    doc.save(options.outfile); 
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
    
    var doc = new jsPDF('portrait','pt','letter');
    
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
    
    /** Second page: empty grid **/
    doc.addPage();
    print_headers(doc,headers,options.header_pt,margin);
    var second_page_options = {
        grid_letters : false
    ,   grid_numbers : true
    ,   x0: grid_xpos
    ,   y0: grid_ypos
    //,   grid_size: grid_size
    ,   cell_size: grid_size / puzdata.width
    ,   gray : options['gray']
    };
    draw_crossword_grid(doc,puzdata,second_page_options);
    print_page_num(doc,options.footer_pt,margin,DOC_HEIGHT,2);
    
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
    
    var page_num = 3;
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
