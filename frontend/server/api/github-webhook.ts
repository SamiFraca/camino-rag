// /api/github-webhook.ts
export default async function handler(req, res) {
  const event = req.body;

  if (event.action !== "opened" && event.action !== "synchronize") {
    return res.status(200).end();
  }

  const pr = event.pull_request;

  // Fetch diff (important!)
  const diff = await fetch(pr.diff_url).then(r => r.text());

  // Call Skrun
  const response = await fetch(
    "https://your-skrun-api.com/api/agents/dev/pr-checker/run",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          title: pr.title,
          description: pr.body,
          diff
        }
      })
    }
  );

  const result = await response.json();

  // Post comment back to GitHub
  await fetch(pr.comments_url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      body: formatReview(result)
    })
  });

  res.status(200).end();
}

function formatReview(result) {
  return `
## 🤖 AI Code Review

${JSON.stringify(result, null, 2)}
`;
}