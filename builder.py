import os
import re

def main():
    source_file = 'project.txt'
    project_root_name = 'multi-tenant-saas'
    missing_report_file = os.path.join(project_root_name, 'missing.txt')
    
    if not os.path.exists(source_file):
        print(f"Error: {source_file} not found!")
        return

    with open(source_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    print("Analyzing structure and parsing code...")

    # --- PART 1: Parse the ASCII Tree to find EXPECTED files ---
    expected_files = []
    path_stack = []
    
    # We assume the tree starts at the beginning or after a specific header.
    # Based on your text, it starts after "Project Structure" or similar.
    # We will look for lines containing tree characters.
    
    tree_started = False
    
    for line in lines:
        clean_line = line.rstrip()
        
        # Check if line looks like a tree part
        if '├──' in line or '└──' in line or '│' in line or line.strip().endswith('/'):
            tree_started = True
            
            # Count indent to determine depth (simple heuristic based on characters)
            indent = 0
            # Identify the actual name part
            match = re.search(r'[\w\-\.\[\]]+/?$', clean_line)
            if not match: 
                continue
                
            name = match.group(0)
            
            # Calculate depth based on prefix length
            prefix = clean_line[:match.start()]
            depth = len(prefix) // 4 # Standard tree indent is usually 4 chars
            
            # Adjust stack
            path_stack = path_stack[:depth]
            path_stack.append(name)
            
            # Construct full path
            full_path = os.path.join(*path_stack)
            
            # If it's a file (doesn't end in /), add to expected list
            if not name.endswith('/'):
                # Remove the root folder name from the path for easier matching later
                if full_path.startswith(project_root_name + '/'):
                    rel_path = full_path[len(project_root_name)+1:]
                    expected_files.append(rel_path)
        
        elif tree_started and line.strip() == "":
            # Empty line usually ends the tree block
            tree_started = False

    print(f"Found {len(expected_files)} files in the tree structure.")

    # --- PART 2: Parse Code Blocks and Headers ---
    created_files = []
    current_filepath = None
    capturing_code = False
    code_buffer = []
    
    # Regex to find headers like "1. Package.json" or "4. Middleware (app/middleware.ts)"
    # Priority: Content inside () -> Explicit path
    header_pattern = re.compile(r'^\d+\.\s+.*?(?:\((.*?)\))?$')

    for i, line in enumerate(lines):
        line = line.rstrip()
        
        # Check for headers
        header_match = header_pattern.match(line)
        if header_match and not capturing_code:
            path_part = header_match.group(1) # The part inside parens e.g. app/middleware.ts
            title_part = line.split('.')[1].split('(')[0].strip() # The title e.g. Package.json
            
            # Determine filepath
            if path_part:
                current_filepath = path_part
            else:
                # If no parens, try to guess from title (e.g. "Package.json")
                if '.' in title_part:
                    current_filepath = title_part.lower() # assuming root
                else:
                    current_filepath = None

            continue

        # Check for Code Block Start
        if line.strip().startswith('```') and not capturing_code:
            if current_filepath:
                capturing_code = True
                code_buffer = []
            continue

        # Check for Code Block End
        if line.strip().startswith('```') and capturing_code:
            capturing_code = False
            
            # Write the file
            full_path = os.path.join(project_root_name, current_filepath)
            dir_name = os.path.dirname(full_path)
            
            if dir_name:
                os.makedirs(dir_name, exist_ok=True)
                
            with open(full_path, 'w', encoding='utf-8') as out_f:
                out_f.write('\n'.join(code_buffer))
            
            print(f"Created: {current_filepath}")
            created_files.append(current_filepath)
            current_filepath = None
            code_buffer = []
            continue

        # Capture Content
        if capturing_code:
            code_buffer.append(line)

    # --- PART 3: Verify Missing Files ---
    missing_files = []
    
    # We clean up paths to ensure matching works (normalize slashes)
    created_set = set(os.path.normpath(f) for f in created_files)
    
    # Handle some filename mismatches (case sensitivity or slight naming diffs)
    # This is a basic check.
    
    for exp_file in expected_files:
        norm_exp = os.path.normpath(exp_file)
        found = False
        
        if norm_exp in created_set:
            found = True
        else:
            # Try relaxed matching (e.g. verify if filename exists in created list)
            # This helps if the tree says "app/page.tsx" but header was "Main Page (app/page.tsx)"
            pass

        if not found:
            missing_files.append(exp_file)

    # Write missing.txt
    if missing_files:
        if not os.path.exists(project_root_name):
            os.makedirs(project_root_name)
            
        with open(missing_report_file, 'w', encoding='utf-8') as mf:
            mf.write("The following files were found in the tree structure but no code block was found for them:\n\n")
            for m in missing_files:
                mf.write(f"- {m}\n")
        print(f"\nWarning: {len(missing_files)} missing files listed in '{missing_report_file}'")
    else:
        print("\nSuccess: All files from the structure seem to be created!")

if __name__ == "__main__":
    main()
