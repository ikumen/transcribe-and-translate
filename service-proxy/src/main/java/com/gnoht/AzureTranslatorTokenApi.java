package com.gnoht;

import javax.ws.rs.POST;
import javax.ws.rs.Path;

import org.eclipse.microprofile.rest.client.annotation.RegisterClientHeaders;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

@Path("/issueToken")             
@RegisterRestClient(configKey = "azure-translator-api")
@RegisterClientHeaders(AzureTranslatorTokenApiClientHeadersFactory.class)
public interface AzureTranslatorTokenApi {
  
  @POST
  String getToken();

}
