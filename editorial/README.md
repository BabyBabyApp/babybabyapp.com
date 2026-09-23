# BabyBaby Guides publisher

The [guide calendar](calendar.json) drives `.github/workflows/publish-guides.yml`. GitHub runs the workflow at 10:17 Europe/Berlin every day, independently of Eric's computer. The script publishes only the earliest due weekly slot that is not already on the site. A daily check gives a missed Thursday run another chance on Friday; GitHub scheduled runs can be delayed or dropped under load.

The first slot uses the reviewed HTML draft in `editorial/drafts/`. The workflow's first push run publishes that guide immediately as an end-to-end test. Later slots are researched with the OpenAI Responses API web-search tool and written into the site's existing guide layout. Source URLs must come from citations in the research response, cover two authoritative organizations, and be linked in the article. A missing key, missing sources, invalid HTML, broken local link, or failed build stops the run before claiming publication.

To enable future AI-written guides, add an `OPENAI_API_KEY` **Actions repository secret** to `BabyBabyApp/babybabyapp.com` in GitHub Settings → Secrets and variables → Actions. The ChatGPT subscription does not supply an API key; API use is billed separately. Optionally set `GUIDES_OPENAI_MODEL` as an Actions repository variable; the default is `gpt-5.5`. Do not commit a key or put it in the workflow file.

The workflow commits the new page, updates the guides index and sitemap, mirrors those files in `dist/`, requests a build from the existing branch-based GitHub Pages site, and polls the public URL. The Actions run reports failures. To retry a failed due slot, use **Run workflow** on the publisher workflow; leave `slug` empty to select the earliest due item.

Calendar copy, facts and app references should be reviewed periodically. Automated source checks confirm provenance and structure, but no automated check can guarantee that every interpretation of a medical or developmental source is correct. If a topic cannot be safely sourced, the job should fail and the guide should be edited or replaced rather than posted with unsupported claims.
