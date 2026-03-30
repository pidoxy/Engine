# apps/web — Main Frontend (theaidcare.com)

This directory should contain the contents of [TheAidCare/frontend](https://github.com/TheAidCare/frontend).

## To populate this directory

```bash
# From the monorepo root
git remote add frontend https://github.com/TheAidCare/frontend.git
git fetch frontend
git checkout frontend/main -- .
# Move the fetched files into apps/web/
# OR use a subtree merge (see MONOREPO_SETUP.md)
```

## After populating

1. Add `@aidcare/types` as a dependency in `package.json`:
   ```json
   "@aidcare/types": "*"
   ```

2. Update imports to use shared types:
   ```typescript
   import type { Patient, Consultation, TriageResult } from "@aidcare/types"
   ```

3. Remove any locally-defined type duplicates.
