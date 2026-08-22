Opens in a new windowOpens an external websiteOpens an external website in a new window

Close this dialog

This website utilizes technologies such as cookies to enable essential site functionality, as well as for analytics, personalization, and targeted advertising. To learn more, view the following link: [Privacy Policy](https://render.com/privacy)

Close Cookie Preferences

Render can [automatically deploy](https://render.com/docs/deploys#automatic-deploys) your application each time you merge a change to your codebase:

![High-level auto-deploy steps](https://render.com/docs-assets/3489cfa05013849a4090b628e47fa65e06d310d078235858141c53db11da72ce/deploy-steps.png)

You can also trigger [manual deploys](https://render.com/docs/deploys#manual-deploys), both programmatically and in the Render Dashboard.

All service types redeploy with [zero downtime](https://render.com/docs/deploys#zero-downtime-deploys), unless they attach a persistent disk.

## Automatic deploys

As part of creating a service on Render, you link a branch of your [GitHub](https://render.com/docs/github)/ [GitLab](https://render.com/docs/gitlab)/ [Bitbucket](https://render.com/docs/bitbucket) repo (such as `main` or `production`). Whenever you push or merge a change to that branch, by default Render automatically rebuilds and redeploys your service.

Auto-deploys appear in your service's **Events** timeline in the Render Dashboard:

![Auto-deploys in the Render Dashboard](https://render.com/docs-assets/9b15bc6c97d02a8c865c96cf2cea326b450cb7c1f96eea9c436b8cd785fa47bb/deploy-events.png)

If needed, you can [skip an auto-deploy](https://render.com/docs/deploys#skipping-an-auto-deploy) for a particular commit, or even [disable auto-deploys entirely](https://render.com/docs/deploys#configuring-auto-deploys).

**Auto-deploys require a connected [GitHub](https://render.com/docs/github), [GitLab](https://render.com/docs/gitlab), or [Bitbucket](https://render.com/docs/bitbucket) account.** Services that use a [prebuilt Docker image](https://render.com/docs/deploying-an-image) or a [public Git repository URL](https://render.com/docs/web-services#deploy-your-own-code) must be deployed [manually](https://render.com/docs/deploys#manual-deploys).

### Configuring auto-deploys

Configure a service's auto-deploy behavior from its **Settings** page in the [Render Dashboard](https://dashboard.render.com/):

![Configuring auto-deploys in the Render Dashboard](https://render.com/docs-assets/3bbe7072be4e7666f400ff864597fc717c8c777c2ed64d85f77511836a398e0f/autodeploy-settings.png)

Under **Auto-Deploy**, select one of the following:

| Option | Description |
| --- | --- |
| **On Commit** | Render triggers a deploy as soon as you push or merge a change to your linked branch.<br>This is the default behavior for a new service. |
| **After CI Checks Pass** | With each change to your linked branch, Render triggers a deploy _only after_ all of your repo's CI checks pass.<br>For details, see [Integrating with CI](https://render.com/docs/deploys#integrating-with-ci). |
| **Off** | Disables auto-deploys for the service.<br>Choose this option if you only want to trigger deploys [manually](https://render.com/docs/deploys#manual-deploys). |

#### Integrating with CI

If you set your service's [auto-deploy behavior](https://render.com/docs/deploys#configuring-auto-deploys) to **After CI Checks Pass**, Render waits for a new commit's CI checks to complete before triggering a deploy. If _all_ checks pass, Render proceeds with the deploy.

For GitHub checks, Render considers a check "passed" if its [conclusion](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks#check-statuses-and-conclusions) is any of `success`, `neutral`, or `skipped`.

**Render does _not_ trigger a deploy if:**

- Zero checks are detected for the new commit
- At least one CI check fails for the new commit

If your repo doesn't run CI checks, use **On Commit** instead of **After CI Checks Pass** to enable auto-deploys.

Select the tab for your Git provider to learn which CI checks are supported:

GitHubGitHub

GitLabGitLab

BitbucketBitbucket

Render detects the results of CI checks originating from the following:

- GitHub Actions
- Tools that integrate with the [GitHub checks API](https://docs.github.com/en/rest/guides/using-the-rest-api-to-interact-with-checks), such as [CircleCI](https://circleci.com/docs/enable-checks)

Supported checks appear on commits and pull requests in the GitHub UI:

![GitHub checks on a pull request](https://render.com/docs-assets/734303880df029d8bca6b29dd014b9866c52aa32143b408f49dc7c425769aba3/checks-github.png)

Render detects the results of jobs executed as part of [GitLab CI/CD pipelines](https://docs.gitlab.com/ci/pipelines/).

Render detects the results of steps executed as part of [Bitbucket Pipelines](https://support.atlassian.com/bitbucket-cloud/docs/get-started-with-bitbucket-pipelines/).

### Skipping an auto-deploy

Certain changes to your codebase might not require a new deploy, such as edits to a `README` file. In these cases, you can include a **skip phrase** in your Git commit message to prevent the change from triggering an auto-deploy:

shellCopy to clipboard

```shell
$ git commit -m "[skip render] Update README"
```

The skip phrase is one of `[skip render]` or `[render skip]`. You can also replace `render` with one of the following:

- `deploy`
- `cd`

When an auto-deploy is skipped, a corresponding entry appears on your service's **Events** page:

![A skipped deploy on a service's Events feed](https://render.com/docs-assets/972fc99017c31e9efd9baec64c1abbc298b27522e99989d6139676dffd3b8d21/deploy-skipped.png)

**For additional control over auto-deploys, configure [**build filters**](https://render.com/docs/monorepo-support#setting-build-filters).**

With build filters, Render triggers an auto-deploy only if there are changes to particular files in your repo (no skip phrase required). [See details](https://render.com/docs/monorepo-support#setting-build-filters).

## Manual deploys

You can manually trigger a Render service deploy in a variety of ways:

DashboardDashboard

CLICLI

Deploy hookDeploy hook

APIAPI

From your service's **Events** page in the [Render Dashboard](https://dashboard.render.com/), open the **Manual Deploy** dropdown:

![Manual deploy options in the Render Dashboard](https://render.com/docs-assets/655ff375e708494e9c84891dd04e8de0ac1f28189747921fa9ca7a61237a6e88/manual-deploy-options.png)

Select a deploy option:

| Option | Description |
| --- | --- |
| **Deploy latest commit** | Deploys the most recent commit on your service's linked branch. |
| **Deploy a specific commit** | Deploys a specific commit from your service's linked repo. Specify a commit by its SHA, or by selecting it from a list of recent commits.<br>**This disables automatic deploys for the service.** This is because an automatic deploy might reintroduce commits you wanted to exclude from this deploy.<br>Learn more about [deploying a specific commit](https://render.com/docs/deploys#deploying-a-specific-commit). |
| **Clear build cache & deploy** | Similar to **Deploy latest commit**, but first clears the service's build cache. This way, the new deploy doesn't reuse any artifacts generated during a previous build.<br>Use this option to incorporate changes to your service's build command, or to refresh stale static assets. |
| **Restart service** | Deploys the same commit that's _currently_ deployed for the service, with the same values for user-defined environment variables. For details, see [Restarting a service](https://render.com/docs/deploys#restarting-a-service). |

Run the [Render CLI](https://render.com/docs/cli)'s [`deploys create`](https://render.com/docs/cli-reference#deploys-create) command:

shellCopy to clipboard

```shell
$ render deploys create
```

This opens an interactive menu that lists the services in your workspace. Select a service to deploy, then proceed through the prompts.

Each Render service has a unique **Deploy Hook URL** available on its **Settings page** in the [Render Dashboard](https://dashboard.render.com/):

![A service's deploy hook URL in the Render Dashboard](https://render.com/docs-assets/5a6fd6a7205d22ecbd9ef234a7adae80302a439b8f1888691d4a6ca40bfeade2/deploy-hook-setting.png)

You can trigger a manual deploy by sending an HTTP GET or POST request to this URL. For details, see [Deploy Hooks](https://render.com/docs/deploy-hooks).

Send a `POST` request to the Render API's [Trigger Deploy endpoint](https://api-docs.render.com/reference/create-deploy).

This endpoint accepts optional body parameters for clearing the service's build cache and/or deploying a specific commit. For services that pull a Docker image, you can specify the URL of the image to pull.

### Deploying a specific commit

When deploying manually, you can optionally specify a commit SHA. If you do, Render builds and deploys the specified commit instead of the latest commit from your service's linked branch.

**If you deploy a specific commit SHA, you should also disable automatic deploys for your service.**

Some deploy methods do this for you automatically. For details, see [Effect on automatic deploys](https://render.com/docs/deploys#effect-on-automatic-deploys).

Learn how to provide a commit SHA using each deploy method:

DashboardDashboard

Deploy hookDeploy hook

CLICLI

APIAPI

1. From your service's **Events** page in the [Render Dashboard](https://dashboard.render.com/), click **Manual Deploy > Deploy a specific commit**:

![Deploying a specific commit in the Render Dashboard](https://render.com/docs-assets/60aa7124520e173f37ff0fd437495721f4f088ccfd782234f7e4dbd924b6db20/deploy-specific-commit.png)

2. In the dialog that appears, select a commit from the list. You can also paste a commit SHA into the text field.

3. Click **Deploy Commit**. Render immediately kicks off a deploy.


This method disables [automatic deploys](https://render.com/docs/deploys#automatic-deploys) for the service.

To deploy a specific commit using [deploy hooks](https://render.com/docs/deploy-hooks), include a `ref` query parameter that specifies the commit SHA to deploy:

bashCopy to clipboard

```bash
# Full commit SHA
https://api.render.com/deploy/srv-XXYYZZ?key=AABBCC&ref=baaa339926cb474b61c1f0e6297b024eaa09ac7d

# Short commit SHA
https://api.render.com/deploy/srv-XXYYZZ?key=AABBCC&ref=baaa339
```

- As shown, you can provide either a full or short commit SHA.
- This method disables [automatic deploys](https://render.com/docs/deploys#automatic-deploys) for the service.

After you run [`render deploys create`](https://render.com/docs/cli-reference#deploys-create) and select a service, the Render CLI prompts you for an optional commit ID. Paste the SHA you want to deploy.

In non-interactive environments, you can specify the commit SHA with the `--commit` flag:

shellCopy to clipboard

```shell
$ render deploys create srv-abc123 --commit def456
```

Using this method does _not_ disable [automatic deploys](https://render.com/docs/deploys#automatic-deploys) for the service. To disable, follow up with the [`render services update`](https://render.com/docs/cli-reference#services-update) command (set the `--auto-deploy` field to `false`).

In your request to the [Trigger Deploy](https://api-docs.render.com/reference/create-deploy) endpoint, include the `commitId` field in the request body:

jsonCopy to clipboard

```json
{
  "commitId": "baaa339926cb474b61c1f0e6297b024eaa09ac7d"
}
```

Using this method does _not_ disable [automatic deploys](https://render.com/docs/deploys#automatic-deploys) for the service. To disable, follow up with a request to the [Update service](https://api-docs.render.com/reference/update-service) endpoint (set the `autoDeploy` field to `no`).

#### Effect on automatic deploys

In almost all cases when you deploy a specific commit for your service, you should also _disable_ [automatic deploys](https://render.com/docs/deploys#automatic-deploys) for it. This is because automatic deploys _always_ use the most recent commit from your service's linked branch, replacing the commit you had just deployed.

Some deploy methods disable automatic deploys for you when you provide a commit SHA:

| Method | Behavior |
| --- | --- |
| **Dashboard** | **Disables** auto-deploys |
| **Deploy hook** | **Disables** auto-deploys |
| **CLI** | **Does not disable** auto-deploys |
| **API** | **Does not disable** auto-deploys |

If you deploy a specific commit with the Render CLI or API, you can disable automatic deploys in the Render Dashboard (see [Configuring auto-deploys](https://render.com/docs/deploys#configuring-auto-deploys)), or with a follow-up action using the same tool (see the [tabs above](https://render.com/docs/deploys#deploying-a-specific-commit)).

If you later reenable automatic deploys for your service, Render once again deploys the most recent commit from your linked branch.

## Deploy steps

With each deploy, Render proceeds through the following commands for your service:

_Deploy_

_initiated_

Build command\*

Pre-deploy

command\*

_(Optional)_

Start command

_Deploy_

_complete_

\*Consumes [pipeline minutes](https://render.com/docs/build-pipeline#pipeline-minutes) while running. [View your usage](https://dashboard.render.com/billing#included-usage).

You specify these commands as part of creating your service in the [Render Dashboard](https://dashboard.render.com/). You can modify these commands for an existing service from its **Settings** page:

![Setting deploy-related commands in the Render Dashboard](https://render.com/docs-assets/a45c40e1135b28c8a43c3ab86f4077bf08397cc30ae56ed8cf124f331d779a79/deploy-commands.png)

Each command is described below.

**If any command fails or times out, the entire deploy fails.** Any remaining commands do not run. Your service continues running its most recent successful deploy (if any), with [zero downtime](https://render.com/docs/deploys#zero-downtime-deploys).

Command timeouts are as follows:

| Command | Timeout |
| --- | --- |
| Build command | 120 minutes |
| Pre-deploy command | 30 minutes |
| Start command | 15 minutes |

### Build command

Performs all compilation and dependency installation that's necessary for your service to run. It usually resembles the command you use to build your project locally.

**This command consumes pipeline minutes while running.**

You receive an included amount of pipeline minutes each month and can purchase more as needed. [View your usage](https://dashboard.render.com/billing#included-usage).

#### Example build commands for each runtime

| Runtime | Example Build Command(s) |
| --- | --- |
| Node.js | `npm install` / `pnpm install` / `bun install`<br>`yarn` |
| Python | `pip install -r requirements.txt`<br>`poetry install`<br>`uv sync`<br>To use `uv`, a `uv.lock` file must be present in your service's root directory. [Learn more](https://render.com/docs/uv-version). |
| Ruby | `bundle install` |
| Go | `go build -tags netgo -ldflags '-s -w' -o app` |
| Rust | `cargo build --release` |
| Elixir | `mix deps.get --only prod && mix compile`<br>`mix deps.get --only prod && mix assets.deploy` |
| Docker | **You can't set a build command for services that use Docker.**<br>Instead, Render either:<br>- [Builds a custom image](https://render.com/docs/docker#building-from-a-dockerfile) based on your Dockerfile<br>- [Pulls a specified image](https://render.com/docs/deploying-an-image) from your container registry |

### Pre-deploy command

If defined, the pre-deploy command runs _after_ your service's build finishes, but _before_ that build is deployed. Recommended for tasks that should always precede a deploy but are _not_ tied to building your code, such as:

- Database migrations
- Uploading assets to a CDN

**The pre-deploy command executes on a separate instance from your running service.**

Changes you make to the filesystem are _not_ reflected in the deployed service. You do not have access to a service's attached persistent disk (if it has one).

The pre-deploy command is available for paid web services, private services, and background workers.

If you _don't_ define a pre-deploy command for a service, Render proceeds directly from the [build command](https://render.com/docs/deploys#build-command) to the [start command](https://render.com/docs/deploys#start-command).

**This command consumes pipeline minutes while running.**

You receive an included amount of pipeline minutes each month and can purchase more as needed. [View your usage](https://dashboard.render.com/billing#included-usage).

### Start command

Render runs this command to start your service when it's ready to deploy.

#### Example start commands for each runtime

| Runtime | Example Start Command(s) |
| --- | --- |
| Node.js | `npm start` / `pnpm start` / `bun run start`<br>`yarn start`<br>`node index.js` |
| Python | `gunicorn your_application.wsgi` |
| Ruby | `bundle exec puma` |
| Go | `./app` |
| Rust | `cargo run --release` |
| Elixir | `mix phx.server`<br>`mix run --no-halt` |
| Docker | By default, Render runs the `CMD` defined in your Dockerfile. You can specify a different command in the **Docker Command** field on your service's **Settings** page.<br>**To run multiple commands with Docker, provide those commands to `/bin/bash -c`.**<br>For example, here's a Docker Command for a Django service that runs database migrations and then starts the web server:<br>plaintextCopy to clipboard<br>```<br>/bin/bash -c python manage.py migrate && gunicorn myapp.wsgi:application --bind 0.0.0.0:10000<br>``` |

## Managing deploys

### Handling overlapping deploys

Only one deploy can run at a time per service. Sometimes, a deploy will trigger while _another_ deploy is still in progress. When this occurs, your service can do one of the following:

| Policy | Description |
| --- | --- |
| **Wait** | Allow the in-progress deploy to finish, then proceed directly to the most recently triggered deploy:<br>![A deploy waiting for an in-progress deploy to complete](https://render.com/docs-assets/4529f653e472079afa795254b2d38ac516baf3db3350d96739d11d751bd9b080/deploy-wait-timeline.png)<br>- In this case, Render skips any "intermediate" deploys, such as Deploy B in the timeline above.<br>- We recommend this option for most workspaces, because it helps maintain a regular cadence of deploys during periods of high change volume.<br>- This is the default policy for workspaces created **on or after 2025-07-14**. |
| **Override** | Immediately cancel the in-progress deploy and start the new one.<br>- This is the default policy for workspaces created **before 2025-07-14**. |

You can set which of these policies to use for your workspace:

1. In the [Render Dashboard](https://dashboard.render.com/), open your workspace's **Settings** page.

2. Scroll down to the **Overlapping Deploy Policy** section and click **Edit**:

![The Overlapping Deploy Policy setting in the Render Dashboard](https://render.com/docs-assets/0279fe915a577449dd3ca701232e77b3de3875567bd1621fd31dde2d3e7542e8/overlapping-deploy-policy.png)

3. Select an option and click **Save changes**.


### Canceling a deploy

You can cancel an in-progress deploy in the [Render Dashboard](https://dashboard.render.com/):

1. Go to your service's **Events** page and click the word **Deploy** in the corresponding event entry.
   - This opens the deploy's details page.
2. Click **Cancel deploy**:

![Canceling a deploy in the Render Dashboard](https://render.com/docs-assets/17abe94078e5f3b877af03e39522ed37da26850373b8ca841891deb1376214cd/deploy-cancel.png)


If you cancel an in-progress deploy while another deploy is [waiting](https://render.com/docs/deploys#handling-overlapping-deploys), Render immediately kicks off the waiting deploy.

### Restarting a service

If your service is misbehaving, you can perform a restart from the service's page in the [Render Dashboard](https://dashboard.render.com/). Click **Manual Deploy > Restart service**:

![Restarting a service in the Render Dashboard](https://render.com/docs-assets/1647dfe89bf2a6e5fb4e0f744fcc2a43a0649cde180edac90988c36c6e91b28a/restart-service.png)

On Render, a service restart is actually a special form of [manual deploy](https://render.com/docs/deploys#manual-deploys):

- Like any other deploy, Render creates a completely new instance of your service and swaps over to it when it's ready.
  - This makes restarting a [zero-downtime action](https://render.com/docs/deploys#zero-downtime-deploys).
  - If your service is [scaled](https://render.com/docs/scaling) to multiple instances, a restart applies to all instances.
- _Unlike_other deploys, the new instance always uses the exact same Git commit and configuration as the running instance at the time of the restart.

  - This means that if you've recently updated your service's environment variables but haven't redeployed since then, restarting does _not_ incorporate those changes.

### Rolling back a deploy

See [Rollbacks](https://render.com/docs/rollbacks).

## Deployment concepts

### Ephemeral filesystem

By default, Render services have an **ephemeral filesystem**. This means that any changes a running service makes to its filesystem are _lost_ with each deploy.

To persist data across deploys, do one of the following:

- Create and connect to a Render-managed datastore (Render [Postgres](https://render.com/docs/postgresql) or [Key Value](https://render.com/docs/key-value)).
- Create and connect to a custom datastore, such as [MySQL](https://render.com/docs/deploy-mysql) or [MongoDB](https://render.com/docs/deploy-mongodb).
- Attach a [persistent disk](https://render.com/docs/disks) to your service.

  - Note the [limitations of persistent disks](https://render.com/docs/disks#disk-limitations-and-considerations).

### Zero-downtime deploys

Whenever you deploy a new version of your service, Render performs a sequence of steps to make sure the service stays up and available throughout the deploy process, even if the deploy fails.

This **zero-downtime deploy** sequence applies to web services, private services, background workers, and cron jobs. Static sites _also_ update with zero downtime, but they're backed by a CDN and don't involve service instances. [Learn more about service types](https://render.com/docs/service-types#summary-of-service-types).

Adding a persistent disk to your service _disables_ zero-downtime deploys for it. [See details](https://render.com/docs/disks#disk-limitations-and-considerations).

#### Sequence of events

1. When you push up a new version of your code, Render attempts to build it.
   - If the build fails, Render cancels the deploy, and your original service instance continues running without interruption.
2. If the build succeeds, Render attempts to spin up a _new_ instance of your service running the new version of your code.


   - **For web services and private services,** your _original_ instance continues to receive all incoming traffic while the new instance is spinning up:

Render

load balancer

Original instance

(v1)

**New instance**

**(v2)**

3. If the new instance spins up successfully (for web services, you can help verify this by setting up [health checks](https://render.com/docs/health-checks)), Render updates your current deployed commit accordingly.


   - **For web services and private services,** Render also updates its networking configuration so that your _new_ instance begins receiving all incoming traffic:

Render

load balancer

Original instance

(v1)

New instance

(v2)

4. After 60 seconds, Render sends a `SIGTERM` signal to your app's process on the _original_ instance.
   - This signals your app to perform a [graceful shutdown](https://render.com/docs/deploys#graceful-shutdown).
5. If your app's process doesn't exit within its specified **shutdown delay** (default 30 seconds), Render sends a `SIGKILL` signal to force the process to terminate.
   - You can extend your service's shutdown delay. [See details](https://render.com/docs/deploys#setting-a-shutdown-delay).
















     Render

     load balancer





     ~~Original instance

     (v1)~~





     New instance

     (v2)
6. For web services with [edge caching](https://render.com/docs/web-service-caching) enabled, Render purges all of the service's cache entries.
   - This helps ensure that clients receive up-to-date content. [See details](https://render.com/docs/web-service-caching#invalidation-and-expiration).
7. The zero-downtime deploy is complete.


**For services that are [scaled](https://render.com/docs/scaling) to multiple instances,** Render performs steps 2-5 for one instance at a time. If _any_ new instance fails to become healthy during this process, Render cancels the entire deploy and reverts to instances running the previous version of your service.

### Graceful shutdown

As part of deploying your service to a new instance, Render triggers a shutdown of the _current_ instance by sending your application a `SIGTERM` signal. Your application should define logic to perform a graceful shutdown in response to this signal.

Common shutdown actions include:

- Responding to remaining in-flight HTTP requests
- Completing in-progress worker tasks (or marking them as failed so they're retried by other workers)
- Terminating outbound connections to external services
- Exiting with a zero status after other cleanup actions are complete

If your service is still running after its configured **shutdown delay** (default 30 seconds), Render sends your application a `SIGKILL` signal. This terminates the application immediately with a non-zero status.

#### Setting a shutdown delay

If your service needs more than 30 seconds to complete a graceful shutdown, you can specify a longer shutdown delay (up to a maximum of 300 seconds) in one of the following ways:

- Call the Render API's [Update service](https://api-docs.render.com/reference/update-service) endpoint and set the `maxShutdownDelaySeconds` field to the desired value.
- Add the [`maxShutdownDelaySeconds`](https://render.com/docs/blueprint-spec#maxshutdowndelayseconds) field to your service's associated `render.yaml` configuration.

  - Use this method if you manage your service with a [Blueprint](https://render.com/docs/infrastructure-as-code).

**Need more than 300 seconds for graceful shutdown?**

Reach out to our support team in the [Render Dashboard](https://dashboard.render.com/?contact-support).

Copy page

###### [Deploying on Render](https://render.com/docs/deploys)

- [Automatic deploys](https://render.com/docs/deploys#automatic-deploys)
  - [Configuring auto-deploys](https://render.com/docs/deploys#configuring-auto-deploys)
  - [Skipping an auto-deploy](https://render.com/docs/deploys#skipping-an-auto-deploy)
- [Manual deploys](https://render.com/docs/deploys#manual-deploys)
  - [Deploying a specific commit](https://render.com/docs/deploys#deploying-a-specific-commit)
- [Deploy steps](https://render.com/docs/deploys#deploy-steps)
  - [Build command](https://render.com/docs/deploys#build-command)
  - [Pre-deploy command](https://render.com/docs/deploys#pre-deploy-command)
  - [Start command](https://render.com/docs/deploys#start-command)
- [Managing deploys](https://render.com/docs/deploys#managing-deploys)
  - [Handling overlapping deploys](https://render.com/docs/deploys#handling-overlapping-deploys)
  - [Canceling a deploy](https://render.com/docs/deploys#canceling-a-deploy)
  - [Restarting a service](https://render.com/docs/deploys#restarting-a-service)
  - [Rolling back a deploy](https://render.com/docs/deploys#rolling-back-a-deploy)
- [Deployment concepts](https://render.com/docs/deploys#deployment-concepts)
  - [Ephemeral filesystem](https://render.com/docs/deploys#ephemeral-filesystem)
  - [Zero-downtime deploys](https://render.com/docs/deploys#zero-downtime-deploys)
  - [Graceful shutdown](https://render.com/docs/deploys#graceful-shutdown)

Did this page help?

![AI assistant avatar](https://render.com/images/render-logo-white.png)

AI assistant

# Ready to help.

Usage policy

### Example prompts

Add a custom domain

Describe service types

Restrict external access to database

Set Node.js version

Powered by [Inkeep Logo](https://www.inkeep.com/)

[Render Discord](https://render.com/discord)