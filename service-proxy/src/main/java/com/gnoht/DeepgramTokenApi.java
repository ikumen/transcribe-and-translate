package com.gnoht;

import java.util.Date;

import javax.ws.rs.POST;
import javax.ws.rs.Path;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonGetter;
import com.fasterxml.jackson.annotation.JsonProperty;

import org.eclipse.microprofile.rest.client.annotation.RegisterClientHeaders;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;
import org.jboss.resteasy.annotations.jaxrs.PathParam;

@Path("/projects")
@RegisterRestClient(configKey = "deepgram-api")
@RegisterClientHeaders(DeepgramTokenApiClientHeadersFactory.class)
public interface DeepgramTokenApi {
  
  @POST
  @Path("/{projectId}/keys")
  DeepgramResponse getToken(
    @PathParam String projectId, 
    DeepgramRequest body
  );

  static public class DeepgramResponse {
    String key;
    Date expireDate;

    @JsonCreator()
    public DeepgramResponse(
        @JsonProperty(value = "key") String key, 
        @JsonProperty(value = "expiration_date") Date expireDate) {
      this.key = key;
      this.expireDate = expireDate;
    }

    public String getKey() {
      return key;
    }

    @JsonGetter(value = "expireDate")
    public Date getExpireDate() {
      return expireDate;
    }    
  }

  public static class DeepgramRequest {
    String comment;
    String[] scopes;
    int expiresIn;

    public DeepgramRequest(String comment, int expiresIn, String[] scopes) {
      this.comment = comment;
      this.scopes = scopes;
      this.expiresIn = expiresIn;
    }

    public DeepgramRequest(String[] scopes) {
      System.out.println("using request defaults");
      this.comment = "Temp key: " + new Date().toString();
      this.scopes = scopes;
      this.expiresIn = 600; // seconds
    }

    public String getComment() {
      return comment;
    }

    public String[] getScopes() {
      return scopes;
    }

    @JsonGetter("time_to_live_in_seconds")
    public int getExpiresIn() {
      return expiresIn;
    }
  }

}
