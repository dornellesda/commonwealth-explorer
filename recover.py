import json

with open('/Users/DornellesDa/.gemini/antigravity-ide/brain/bc4922ad-7b74-4ddd-9fb0-c39b93fca48b/.system_generated/logs/transcript.jsonl') as f:
    for line in f:
        if 'replace_file_content' in line or 'multi_replace_file_content' in line:
            try:
                data = json.loads(line)
                if 'tool_calls' in data:
                    for call in data['tool_calls']:
                        if 'App.jsx' in json.dumps(call):
                            args = call.get('function', {}).get('arguments', '')
                            if 'Recentre' in args or 'recentre' in args or 'Explore' in args:
                                print("FOUND SOMETHING!")
                                print(args[:500])
            except Exception as e:
                pass
