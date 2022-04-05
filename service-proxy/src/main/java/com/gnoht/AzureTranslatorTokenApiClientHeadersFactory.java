package com.gnoht;

import javax.enterprise.context.ApplicationScoped;
import javax.ws.rs.core.MultivaluedMap;

import org.eclipse.microprofile.config.ConfigProvider;
import org.eclipse.microprofile.rest.client.ext.ClientHeadersFactory;

@ApplicationScoped
public class AzureTranslatorTokenApiClientHeadersFactory implements ClientHeadersFactory {
  static final String AUTHENTICATION_HEADER = "Ocp-Apim-Subscription-Key";
  static final String AUTHENTICATION_PROP = "azure-translator-api.subscription-key";

  private String authenticationKey;

  public AzureTranslatorTokenApiClientHeadersFactory() {
    authenticationKey = ConfigProvider.getConfig().getValue(AUTHENTICATION_PROP, String.class);
  }

  @Override
  public MultivaluedMap<String, String> update(MultivaluedMap<String, String> incomingHeaders,
      MultivaluedMap<String, String> clientOutgoingHeaders) {
    clientOutgoingHeaders.add(AUTHENTICATION_HEADER, authenticationKey);
    return clientOutgoingHeaders;
  }
  
}
