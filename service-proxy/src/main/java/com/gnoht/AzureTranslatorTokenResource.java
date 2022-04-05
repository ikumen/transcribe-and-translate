package com.gnoht;

import javax.inject.Inject;
import javax.ws.rs.GET;
import javax.ws.rs.Path;

import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.rest.client.inject.RestClient;

import io.vertx.core.impl.logging.Logger;
import io.vertx.core.impl.logging.LoggerFactory;

@Path("/api/azuretranslator/token")
public class AzureTranslatorTokenResource {
  
  Logger log = LoggerFactory.getLogger(AzureTranslatorTokenResource.class);

  @Inject
  @RestClient
  AzureTranslatorTokenApi translatorService;

  @ConfigProperty(name = "azure-translator-api.region")
  String region;

  @GET
  public AzureTranslatorTokenResponse getToken() {
    log.info("Fetching short-lived authentication token from Azure Translator");
    return new AzureTranslatorTokenResponse(
      translatorService.getToken(), region
    );
  }

  static public class AzureTranslatorTokenResponse {
    String key;
    String region;

    public AzureTranslatorTokenResponse(
        String key, String region) {
      this.key = key;
      this.region = region;
    }

    public String getKey() {
      return key;
    }

    public String getRegion() {
      return region;
    }    
  }
}
