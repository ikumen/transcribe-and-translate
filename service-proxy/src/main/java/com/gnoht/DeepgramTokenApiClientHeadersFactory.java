package com.gnoht;

import javax.enterprise.context.ApplicationScoped;
import javax.ws.rs.core.MultivaluedMap;

import org.eclipse.microprofile.config.ConfigProvider;
import org.eclipse.microprofile.rest.client.ext.ClientHeadersFactory;

@ApplicationScoped
public class DeepgramTokenApiClientHeadersFactory implements ClientHeadersFactory {
  static final String AUTHENTICATION_HEADER = "Authorization";
  static final String AUTHENTICATION_PROP = "deepgram-api.authentication-key";
  private String authenticationKey;

  public DeepgramTokenApiClientHeadersFactory() {
    authenticationKey = ConfigProvider.getConfig().getValue(AUTHENTICATION_PROP, String.class);
  }

  @Override
  public MultivaluedMap<String, String> update(MultivaluedMap<String, String> incomingHeaders,
      MultivaluedMap<String, String> clientOutgoingHeaders) {
    clientOutgoingHeaders.add(AUTHENTICATION_HEADER, "Token " + authenticationKey);
    return clientOutgoingHeaders;
  }
}
