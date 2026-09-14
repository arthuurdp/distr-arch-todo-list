package com.todolist.api.shared.config;

import java.nio.charset.StandardCharsets;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import com.nimbusds.jose.jwk.source.ImmutableSecret;

@Configuration
@EnableConfigurationProperties(JwtProperties.class)
public class JwtConfig {
	@Bean
	JwtEncoder jwtEncoder(JwtProperties jwtProperties) {
		return new NimbusJwtEncoder(new ImmutableSecret<>(secretKey(jwtProperties)));
	}

	@Bean
	JwtDecoder jwtDecoder(JwtProperties jwtProperties) {
		NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(secretKey(jwtProperties))
				.macAlgorithm(MacAlgorithm.HS256)
				.build();
		decoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(jwtProperties.issuer()));
		return decoder;
	}

	private SecretKey secretKey(JwtProperties jwtProperties) {
		return new SecretKeySpec(jwtProperties.secret().getBytes(StandardCharsets.UTF_8), "HmacSHA256");
	}
}
