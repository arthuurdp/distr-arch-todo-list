package com.todolist.api.auth;

import java.time.Instant;

import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import com.todolist.api.auth.dto.TokenResponse;
import com.todolist.api.shared.config.JwtProperties;
import com.todolist.api.shared.security.SecurityClaims;
import com.todolist.api.user.User;

@Service
public class TokenService {
	private final JwtEncoder jwtEncoder;
	private final JwtProperties jwtProperties;

	public TokenService(JwtEncoder jwtEncoder, JwtProperties jwtProperties) {
		this.jwtEncoder = jwtEncoder;
		this.jwtProperties = jwtProperties;
	}

	public TokenResponse issueToken(User user) {
		Instant now = Instant.now();
		JwtClaimsSet claims = JwtClaimsSet.builder()
				.issuer(jwtProperties.issuer())
				.issuedAt(now)
				.expiresAt(now.plus(jwtProperties.expiration()))
				.subject(user.getId().toString())
				.claim(SecurityClaims.EMAIL, user.getEmail())
				.claim(SecurityClaims.ROLE, user.getRole().name())
				.build();
		JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();

		String token = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
		return new TokenResponse(token, "Bearer", jwtProperties.expiration().toSeconds());
	}
}
