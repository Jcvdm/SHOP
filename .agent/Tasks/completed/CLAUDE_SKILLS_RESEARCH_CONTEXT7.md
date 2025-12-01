# Claude Skills Research - Context 7 MCP Documentation

**Date**: November 3, 2025  
**Source**: Context 7 MCP Library Documentation  
**Status**: Research Complete

---

## Executive Summary

Claude Skills are **dynamic knowledge modules** that Claude loads to improve performance on specialized tasks. They're folders containing instructions, scripts, and resources that auto-invoke based on keywords and context.

---

## What Are Claude Skills?

### Definition
Skills are **folders of instructions, scripts, and resources** that Claude loads dynamically to improve performance on specialized tasks. They work like domain-specific expertise modules.

### Key Characteristics
- **Auto-invoke**: Activate automatically based on keywords/context
- **Modular**: Organized as self-contained folders
- **Composable**: Can work together with other skills
- **Versioned**: Support multiple versions (e.g., 'latest')
- **Distributable**: Packaged as zip files for sharing

---

## Skill Structure

### Minimal Structure
```
my-skill/
  └── SKILL.md  (required)
```

### Full Structure
```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter metadata
│   │   ├── name: (required)
│   │   └── description: (required)
│   └── Markdown instructions
└── Bundled Resources (optional)
    ├── scripts/          # Executable code (Python/Bash/etc.)
    ├── references/       # Documentation (loaded as needed)
    └── assets/           # Files used in output (templates, icons, fonts)
```

### SKILL.md Format
```yaml
---
name: my-skill-name
description: A clear description of what this skill does and when to use it
---

# My Skill Name

[Add your instructions here that Claude will follow when this skill is active]

## Examples
- Example usage 1
- Example usage 2

## Guidelines
- Guideline 1
- Guideline 2
```

---

## Skill Lifecycle

### 1. Initialize
```bash
python scripts/init_skill.py my-new-skill --path skills/
```
Creates:
- `SKILL.md` with TODO placeholders
- `scripts/` directory
- `references/` directory
- `assets/` directory

### 2. Develop
- Add Python/Bash scripts in `scripts/`
- Add reference documentation in `references/`
- Add assets (templates, icons) in `assets/`
- Update `SKILL.md` with instructions

### 3. Validate
```bash
python scripts/quick_validate.py path/to/my-skill
```
Checks:
- YAML frontmatter validity
- Naming conventions
- Description quality
- File organization

### 4. Package
```bash
python scripts/package_skill.py path/to/my-skill ./dist
```
Output: `dist/my-skill.zip` (distributable)

---

## Best Practices

### Description Quality
Use **third-person, specific descriptions**:
```yaml
# ✅ GOOD
description: Extract text and tables from PDF files, fill forms, merge documents. 
Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.

# ❌ BAD
description: PDF processing tool
```

### Organization by Domain
For large skills (e.g., BigQuery), organize references by domain:
```
references/
├── finance.md      # Revenue, ARR, billing
├── sales.md        # Opportunities, pipeline
├── product.md      # API usage, features
└── marketing.md    # Campaigns, attribution
```

### Tool Naming Conventions
- Use `snake_case`
- Include service prefix: `slack_send_message`, `github_create_issue`
- Be action-oriented (start with verbs)
- Be specific and maintain consistency

---

## Integration with MCP

### Skills vs MCP Servers
| Aspect | Skills | MCP Servers |
|--------|--------|------------|
| **Purpose** | Domain expertise | External tool integration |
| **Activation** | Auto-invoke on keywords | Manual tool calls |
| **Scope** | Specialized knowledge | Any external service |
| **Packaging** | Zip files | Command-based |

### Using Skills in Messages API
```python
import anthropic

client = anthropic.Anthropic()

response = client.beta.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=4096,
    betas=["code-execution-2025-08-25", "skills-2025-10-02"],
    container={
        "skills": [
            {
                "type": "anthropic",
                "skill_id": "pptx",
                "version": "latest"
            }
        ]
    },
    messages=[{
        "role": "user",
        "content": "Create a presentation about renewable energy"
    }],
    tools=[{
        "type": "code_execution_20250825",
        "name": "code_execution"
    }]
)
```

---

## Real-World Examples

### BigQuery Helper Skill
```bash
# Initialize
python scripts/init_skill.py bigquery-helper --path ./skills

# Add scripts for common operations
cat > scripts/run_query.py << 'EOF'
#!/usr/bin/env python3
from google.cloud import bigquery
import sys

client = bigquery.Client()
query = sys.argv[1]
df = client.query(query).to_dataframe()
print(df.to_string())
EOF

# Add reference documentation
cat > references/schema.md << 'EOF'
# BigQuery Schema

## users table
- user_id: INT64 (primary key)
- email: STRING
- created_at: TIMESTAMP
EOF

# Validate and package
python scripts/package_skill.py skills/bigquery-helper ./dist
```

---

## ClaimTech Skills Status

### Current Skills (3 Active)
1. **supabase-development** - Database operations, RLS, storage
2. **claimtech-development** - SvelteKit, migrations, auth, PDF
3. **assessment-centric-specialist** - Assessment pipeline, stages

### Configuration
Located in `.claude/settings.local.json`:
```json
{
  "permissions": {
    "allow": [
      "Skill(supabase-development)",
      "Skill(claimtech-development)",
      "Skill(assessment-centric-specialist)"
    ]
  }
}
```

---

## Key Takeaways

✅ **Skills are lightweight, modular expertise**  
✅ **Auto-invoke on keywords for seamless integration**  
✅ **Can include scripts, references, and assets**  
✅ **Packaged as distributable zip files**  
✅ **Work alongside MCP servers for complete tool ecosystem**  
✅ **ClaimTech has 3 well-structured skills in place**

---

## Resources

- **Anthropic Skills Repository**: `/anthropics/skills` (317 code snippets, Trust: 8.5)
- **OpenSkills CLI**: `/numman-ali/openskills` (47 snippets, Trust: 8.2)
- **Claude Code Documentation**: `/websites/anthropic_developers`
- **MCP Documentation**: `/websites/modelcontextprotocol_io` (Trust: 7.5)

