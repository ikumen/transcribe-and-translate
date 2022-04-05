package com.gnoht;

import javax.inject.Inject;
import javax.ws.rs.GET;
import javax.ws.rs.Path;

import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.rest.client.inject.RestClient;

import io.vertx.core.impl.logging.Logger;
import io.vertx.core.impl.logging.LoggerFactory;

import com.gnoht.DeepgramTokenApi.DeepgramRequest;
import com.gnoht.DeepgramTokenApi.DeepgramResponse;

@Path("/api/deepgram/token")
public class DeepgramTokenResource {
  Logger log = LoggerFactory.getLogger(DeepgramTokenResource.class);
    
  @Inject
  @RestClient
  DeepgramTokenApi tokenService;

  @ConfigProperty(name = "deepgram-api.project-id")
  String projectId;

  @ConfigProperty(name = "deepgram-api.scopes")
  String[] scopes;

  @GET
  public DeepgramResponse getToken() {
    log.info("Fetching short-lived authentication token from Deepgram");
    return tokenService.getToken(projectId, new DeepgramRequest(scopes));
  }

}
