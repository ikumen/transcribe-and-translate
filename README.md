# Transcribe and Translate
A simple browser extension that can transcribe and translate audio from any web page. The extension works by capturing audio on the web page, then streams it to [Deepgram's Speech-To-Text API](https://developers.deepgram.com/api-reference/) for transcribing, and then to [Azure's translation service](https://azure.microsoft.com/en-us/services/cognitive-services/translator/) for a final translation into a target language. It is my entry to the [Deepgram + DEV hackathon](https://dev.to/devteam/join-us-for-a-new-kind-of-hackathon-on-dev-brought-to-you-by-deepgram-2bjd).

<img alt="transcriber architecture" src="https://dev-to-uploads.s3.amazonaws.com/uploads/articles/6zzigdb18ub1rlh3pg0x.png" width="600">

## Development Setup

The project contains two parts, the main extension source and a API service proxy responsible for requesting short-lived access tokens for the extension to use.

```
|____extension
| |____background.js
| |____icons
| | |____speaker-48.png
| |____manifest.json
| |____content.js
|
|____service-proxy
| |____mvnw.cmd
| |____pom.xml
| |____src
|   |____....
|
|____LICENSE
|____README.md
```

### Locally Test Extension

The extension uses some Chrome specific APIs, so it will only work on Chrome based browsers (e.g, Chrome, Edge). To install it locally, simply:

`-> Manage extensions -> Load unpacked -> select the directory of the extension`

### Locally Running API Service Proxy

1. create [account for Deepgram](https://console.deepgram.com/signup), [generate an API Key](https://developers.deepgram.com/documentation/getting-started/authentication/#create-an-api-key)
1. create [an Azure account](https://azure.microsoft.com/en-us/free/), [provision an Azure Translator service](https://docs.microsoft.com/en-us/azure/cognitive-services/translator/quickstart-translator?tabs=csharp) 
1. create a `.env` file and add the Azure Translator subscription key, and Deepgram API key and project id.

    ```
    azure-translator-api.subscription-key=<your Azure translator subscription key>
    deepgram-api.authentication-key=<your Deepgram api key>
    deepgram-api.project-id=<your Deepgram project id>
    ```
1. start the local service proxy
    ```
    > ./mvnw quarkus:dev
    ```
