import csv

file_path = "g:\\Projects\\neco-payment-manager-FE\\COUNTING_PKGING__BATCH A_2025_SSCE_EXT_cleaned.csv"

# Mock State Map (lowercase -> capital)
state_map = {
    'niger': 'Minna',
    'abuja': 'Abuja',
    'fct': 'Abuja',
    'kano': 'Kano',
    'lagos': 'Ikeja',
    'gombe': 'Gombe'
}

try:
    with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
        rows = list(csv.reader(f))

    print(f"Total rows: {len(rows)}")
    
    # 1. Simulate finding header
    known_headers = ['S/N', 'State', 'Name', 'File No', 'Conraiss', 'Posting', 'Station', 'Mandate']
    header_row_idx = 0
    max_matches = 0
    
    for i, row in enumerate(rows[:30]):
        row_str = " ".join(row).lower()
        match_count = 0
        for h in known_headers:
            if h.lower() in row_str:
                match_count += 1
        
        if match_count > max_matches:
            max_matches = match_count
            header_row_idx = i

    headers = [str(x).strip() for x in rows[header_row_idx]]
    print(f"FOUND HEADER at row {header_row_idx}: {headers}")
    
    # Add Posted To to mocked headers
    headers.append('Posted To')
    
    state_idx = -1
    posting_idx = -1
    
    for idx, h in enumerate(headers):
        if h.lower() == 'state': state_idx = idx
        if h.lower() == 'posting': posting_idx = idx
        
    print(f"State Index: {state_idx}, Posting Index: {posting_idx}")

    print("\n--- Rows Inspection ---")
    
    for i in range(header_row_idx + 1, len(rows)):
        row_values = [str(c).strip() for c in rows[i]]
        
        # ... skip junk filtering logic for brevity, focus on Posted To ...
        
        posted_to = "NOT FOUND"
        
        # Logic: State first, then Posting
        if state_idx != -1 and state_idx < len(row_values):
            val = row_values[state_idx].lower()
            if val in state_map:
                posted_to = state_map[val]
        
        if posted_to == "NOT FOUND" and posting_idx != -1 and posting_idx < len(row_values):
            val = row_values[posting_idx].lower()
            if val in state_map:
                 posted_to = state_map[val]
        
        print(f"Row {i}: State='{row_values[state_idx] if state_idx < len(row_values) else ''}', Posting='{row_values[posting_idx] if posting_idx < len(row_values) else ''}' -> Posted To='{posted_to}'")

except Exception as e:
    print(f"Error: {e}")
