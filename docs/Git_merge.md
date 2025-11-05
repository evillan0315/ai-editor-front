To update `main` with **all created branches**, you need to merge each branch into `main`. Below are two approaches: **merge** (keeps history) and **squash merge** (clean history).

---

## 1. Merge each branch into `main` (preserves commit history)

```bash
FilePath: <terminal/cli>
Title: Merge feature branches into main
Reason: Update main with all commits from created branches without rewriting commit history
git checkout main
git pull origin main

# Repeat this part for every branch you want to merge:
git merge <branch-name>

# After merging all branches:
git push origin main
```

---

## 2. Squash merge each branch into `main` (clean history into one commit per branch)

```bash
FilePath: <terminal/cli>
Title: Squash merge branches into main
Reason: Consolidate all commits from a branch into a single commit when merging into main
git checkout main
git pull origin main

# Repeat this part for every branch you want to squash merge:
git merge --squash <branch-name>
git commit -m "Merge <branch-name> into main"

git push origin main
```

---

## 3. If you have many branches and want to merge them programmatically

> Only use this if you are absolutely certain all branches should be merged.

```bash
FilePath: <terminal/cli>
Title: Script to merge all branches into main
Reason: Automate merges when many branches must be merged into main
git checkout main
git pull origin main

for branch in $(git branch --format='%(refname:short)' | grep -v 'main'); do
  echo "Merging branch: $branch"
  git merge "$branch"
done

git push origin main
```

---

### Important Notes

* If conflicts occur, Git will stop and require manual resolution.
* If branches are experimental and not all should go to `main`, avoid the automated loop.

---

If you want, I can generate a script that:

* Squash merges only specific branches,
* Automatically handles conflicts by skipping problematic ones, or
* Creates a PR for each merge.

Just tell me your branch list or whether you prefer **preserving history** or **squashing**.
