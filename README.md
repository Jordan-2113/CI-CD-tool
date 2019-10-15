# Sample CI/CD Code

Mile Two’s DevSecOps services are designed to help drive improvements in software delivery, operations and compliance. In this article we want to share with you, in some detail, how this is accomplished by pointing at several coding samples that illustrates our approach to certain DevSecOps capabilities.

This repo is structured as follows:

```bash
cicd-sample             <- This repo
 ├── sample-app         <- Sample application code
 └── sample-environment <- Sample environment config
```

* **cicd-sample** - This source repo
* **sample-app** - The [sample-app folder](sample-app) contains a sample application. In this case the application is a simple web UI but could be an API or some other micro service.  The application is contained here in a subfolder for illustration purposes but real applications would be contained in its own source code repo.  We favor single purpose repos not monolithic/multipurpose repos. In other words, we favor the micro service approach.
* **sample-environment** - The [sample-environment folder](sample-environment) contains all the configuration resources needed to declaratively define the environment. This is often referred to as Configuration-as-Code (CaC) and Infrastructure-as-Code (IaC). It too would be contained in its own source repo and is only a subfolder here for illustration purposes. An environment repo is a [Helm chart](sample-environment/env/Chart.yaml) that has every application and service for the environment explicitly listed along with its version number in the  [requirements.yaml](sample-environment/env/requirements.yaml) file.  There is one environment repo for each target environment such as; development, integration, test, pre-production, and production.  

## GitOps

We use Git as the single source of truth for declarative infrastructure and applications. All deployments start with a Pull Request. For example, to deploy a new version of the *sample-app* into the *sample-environment*, one would update [the version number of sample-app](sample-environment/env/requirements.yaml#L15) in the [requirements.yaml](sample-environment/env/requirements.yaml) file.  The code snippet below illustrates the change.


```yaml
// before PR
...
- name: sample-app
  repository: http://jenkins-x-chartmuseum:8080
  version: 0.1.55
...


// after PR
- name: sample-app
  repository: http://jenkins-x-chartmuseum:8080
  version: 0.1.56           <- changed this line
...
```

Although the environment repo can be modified manually to deploy new versions of the application, most of the time the change is preformed automatically via the CI pipeline. Once an application build is successful the [jx step post build](sample-app/Jenkinsfile#L93) command will open a Pull Request against the environment repo.  For the integration environments the Pull Requests are accepted automatically and this initiates a [CD pipeline](sample-environment/Jenkinsfile) which will perform the actual deployment of the application into the environment. For production environments the Pull Requests are not automatically accepted rather they can only be accepted by authorized individuals, thereby serving as an audit and control function.

## CI/CD Pipelines

Each project contains a *Jenkinsfile* used to declaratively describe the pipeline:

* The *Jenkinsfile* in the application repo defines a [CI pipeline](sample-app/Jenkinsfile)
* The *Jenkinsfile* in the environment repo defines a [CD pipeline](sample-environment/Jenkinsfile).

### CI Pipeline

Let's take a closer look at the [CI pipeline](sample-app/Jenkinsfile) for the application.  The high level steps are the same for all the applications, regardless of programming language:

* **CI Build and push snapshot** - Builds the application and runs lint and unit tests. If successful, a preview environment is created and the application is deployed into that environment. **Note:** the preview environment will live on after the pipeline is finished so users can access the environment and manually review the changes. The preview environment is cleaned up at the end of the day by a scheduled job.
* **e2e** - Run end-to-end tests against the application in the preview environment. The Cypress testing tool is used for e2e testing and the tests for the application are stored in the [cypress](sample-environment/cypress) folder.
* **Build Release** - If the e2e tests are successful then a release is created. The steps for building a release are:
  * sonar-scanner is used to perform code quality and security scanning.  The results are saved in **sonar**qube according to the [sonar-project.properties](sample-app/sonar-project.properties) file.
  * skaffold is used to create the docker image and push it to the container registry according to the [skaffold.yaml](samle-app/skaffold.yaml) file.
  * Jenkins X uses anchore to scan the docker image just created for CVEs.  Anchore will scan the "OS" files in the image as well as the application libraries such as node modules or python libraries.
  * Jenkins X uses helm to publish the application chart to ChartMuseum.

* **Promote to Environments** - Lastly Jenkins X will automatically deploy the release into any permanent environment, marked as *Auto* deploy, in our case the *Staging* environment. It does this by updating the application version number in the [environment's requirements.yaml](sample-environment/env/requirements.yaml) file and then opening a PR for the change. The PR is automatically merged into master and this initiates the [environment's CD pipeline](sample-environment/Jenkinsfile)

### CD Pipeline

Let's take a look at the [environment's CD pipeline](sample-environment/Jenkinsfile) triggered in the last step of the application pipeline. 

* **Validate Environment** - Validate the environment helm chart
* **Update Environment** - Apply the environment helm chart

## Charts

Each project contains a helm chart to aid in the Kubernetes deployment.

### Environment Charts

Each environment repo contains a helm chart that is used to describe its Kubernetes deployment. All the configuration, environment specific application values and a list of applications are described in this repo in the [environment chart](sample-environment/env). The layout of the environment chart is shown below:

```text
env/
├── Chart.yaml
├── requirements.yaml  <-- A list of applications, include as sub-charts
├── templates
└── values.yaml        <-- Environment specific values for this environment
```

* [Chart.yaml](sample-environment/env/Chart.yaml) - contains the name and version of this chart
* [requirements.yaml](sample-environment/env/requirements.yaml) - contains the list of applications sub-charts deployed in this environment. For example, the following yaml snippet shows the inclusion of `samle-app` into this environment:

    ```yaml
    - name: sample-app
      repository: http://jenkins-x-chartmuseum:8080
      version: 0.1.55
    ```

* [templates](sample-environment/env/templates) - Kubernetes manifest files unique to this environment. For example, environment specific config maps might be included here.
* [values.yaml](sample-environment/env/values.yaml) - contains all the property override values for this environment. For example, when the [CD pipeline](sample-environment/Jenkinsfile) runs, the [environment chart](sample-environment/env) is applied using `helm install`. The snippet below shows the override values used by the *sample-api* when deployed in this environment. In this case we see the environment specific values for `DB_HOST`, `REDIS_SERVER` and so on:  

    ```yaml
    sample-api:
      env:
        ENV: 'staging'
        DB_HOST: 'mongodb'
        DB_PORT: '27017'
        DB_DATABASE: 'sampledb'
        REDIS_SERVER: 'redis://staging-redis-master:6379'  
        REDIS_CHANNEL: 'socket.io'
    ```

### Application Charts

Each application has a [chart folder](sample-app/charts) with two helm charts, one for the application and the second for its preview environment. 

```text
charts
├── preview
│   ├── Chart.yaml
│   ├── Makefile
│   ├── requirements.yaml
│   ├── templates
│   └── values.yaml
└── sample-app
    ├── Chart.yaml
    ├── Makefile
    ├── README.md
    ├── templates
    └── values.yaml
```

#### Preview Chart

Each chart, because it is a Helm chart, has a similar layout, however notice how the [preview chart](sample-app/charts/preview) contains a [requirements.yaml](sample-app/charts/preview/requirements.yaml) file. The *preview chart* is really an on-demand environment chart and the [requirements.yaml](sample-app/charts/preview/requirements.yaml) is used to list all of the application's dependencies such as an API and database needed to preview the application.  This allows the team to preview a fully functional application before merging to master. This is particularly useful with UI changes. Also, the pipeline is able to run automated end-to-end tests in a "disposable" preview environment. The following yaml snippet from the [requirements.yaml](sample-app/charts/preview/requirements.yaml) shows how the API, database and redis are deployed each time a preview environment is created.

```yaml
- name: sample-api
  repository: http://jenkins-x-chartmuseum:8080
  version: 0.1.33
- name: mongodb
  repository: https://kubernetes-charts.storage.googleapis.com
  version: 7.0.2
- name: redis
  repository: https://kubernetes-charts.storage.googleapis.com
  version: 6.4.5
```

#### application chart

The [application chart](sample-app/charts/sample-app), unlike an [environment chart](sample-environment/env), is used to describe a single application.  The [templates](sample-app/charts/sample-app/templates) folder contains the Kubernetes manifest files needed to run the application. In this case we have a [deployment.yaml](sample-app/charts/sample-app/templates/deployment.yaml) and a [service.yaml](sample-app/charts/sample-app/templates/service.yaml) manifest files. Notice how these manifest files are not hardcoded.  All of the property values that can change between environments are templated.  A template directive is enclosed in `{{` and `}}` blocks. In this way the same chart can be used to deploy the application to different environments without rebuilding the application. The property values in the [application’s values.yaml](sample-app/charts/sample-app/values.yaml) contain the application defaults.  These values may be overridden when the application is deployed with the values stored in the [environment's values.yaml](sample-environment/env/values.yaml) file.  

## CICD Pipeline Setup

This section contains the steps needed to setup a standard web UI project.

### Clone Projects

Clone the web ui project, referred to here as `myproj` and the template project, `template-ui`.


```bash
PROJ=myproj   # CHANGE ME!!!

# Clone template-ui project it will be used as a staring point
# we will copy a few files from this project
git clone https://gitlab.com/mile-two/template-ui.git

# Clone your project and create a working branch
git clone https://gitlab.com/mile-two/$PROJ

cd $PROJ
git checkout -b cicd
```

### Create JenkinsX Pipeline

This section will create the JenkinsX pipeline using the `jx import` command.  This command will do the following:

* Create Jenkinsfile to hold the CI/CD pipeline
* Create Helm chart for this project
* Create skaffold files for docker build

```bash
jx import

? Which Git service do you wish to use https://gitlab.com
? Do you wish to use build_bot as the Git user name: Yes

# verify that the pipeline was created
jx get pipelines | grep $PROJ
```

### Copy in template files

The `jx import` command did most of the work, now we need to copy a few files from the template project to tailor the build for our environment.

```bash
# Copy over a few files from template-ui
cp ../template-ui/Jenkinsfile  Jenkinsfile
cp ../template-ui/nginx.conf nginx.conf
cp ../template-ui/Dockerfile Dockerfile
cp ../template-ui/sonar-project.properties sonar-project.properties

# Update the project name in the template files and 
# use cicd branch to test our changes
sed -i ""  "s/template-ui/$PROJ/g" Jenkinsfile
sed -i ""  "s/master/cicd/g" Jenkinsfile
sed -i ""  "s/template-ui/$PROJ/g" sonar-project.properties 
```

### Verify app

Next we will verify the application build and unit tests.

```bash
npm install
npm test
npm run build
```

### Set Build Channel

Open `Jenkinsfile` and set the `FAILURE_SLACK_CHANNEL` specific for this project.

### Test the Dockerfile

```bash
docker build -t $PROJ:test .
docker run -it -p 8080:8080 --rm $PROJ:test

# verify
open http://localhost:8080

# in a new terminal run this and note the values
# they will be used to adjust the resources in the next step
docker stats
```

### Test Sonar

* Point browser at `http://sonar.mile-two.com`
* Start the new project wizard and generate a new key 
* Update the `sonar.login` in `sonar-project.properties` with the new key
* Run `sonar-scanner` in the root of the project so that it uses the values in `sonar-project.properties`

```bash
sonar-scanner
```

### Configure e2e

Add to `.gitignore`

```text
# sonar
.scannerwork

# cypress
**/videos
```

```bash
npm install cypress@^3.4.1 --save-dev
npm install
npx cypress open  # this will create a cypress folder
rm -rf cypress/fixtures/example.json
rm -rf cypress/plugins/index.js
rm -rf cypress/integration/examples
rm -rf cypress/videos
```

Add `"e2e": "cypress run",` to the `scripts` in your `package.json` file

Add a simple test:

```bash
touch cypress/integration/indexhtm_200.spec

# and then add the following content
it('Test 200 Response', () => {
  cy.request({
    url: Cypress.env('APP_URL')
  })
    .then((resp) => {
      expect(resp.status).to.eq(200)
    })
})
```

Create `cypress.json` and add this content:

```bash
touch cypress.json

# and then add the following content
{
  "env": {
    "APP_URL": "http://localhost:3000"
  },
  "video": false
}
```

To run the e2e tests:

```bash
npm start
npm run e2e
```

### Adjust Resources

Edit the `resources` section of the `$PROJ/charts/$PROJ/values.yaml` file.  Use the `docker stats` values to set the limits.  

#### Before

```text
...
resources:
  limits:
    cpu: 400m
    memory: 256Mi
  requests:
    cpu: 200m
    memory: 128Mi
probePath: /
...
```

#### After

```text
...
resources:
  limits:
    cpu: 100m
    memory: 20Mi
  requests:
    cpu: 50m
    memory: 5Mi
probePath: /probe
...
```

### Configure ExternalName for API in Staging

First `touch charts/preview/templates/service.yaml` then add content like below replacing `foo-api` with the actual project name:

```
kind: Service
apiVersion: v1
metadata:
  name: foo-api
spec:
  type: ExternalName
  # Target service DNS name
  externalName: foo-api.staging.svc.cluster.local
  ports:
  - port: 80
```

### commit and push 

```bash
# You should still be on the cicd branch
git status
git add .
git commit -m "initial cicd setup"
git push
```

After the push the pipeline should get triggered.  Open the jenkins console and verify that the pipeline was successful.  If all is good point the `Jenkisfile` at the `master` barnch and create merge request to merge `cicd` branch into the `master` branch.

```bash
js console

# If all is good...
# Point Jenkisfile at master branch
sed -i ""  "s/cicd/master/g" Jenkinsfile
git add .
git commit -m "Point Jenkisfile at master branch"
git push
```

Lastly merge to master and verify again that the pipeline builds worked.
