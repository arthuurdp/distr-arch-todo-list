package com.todolist.api.shared.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

import com.todolist.api.shared.security.AuthenticatedUserJwtConverter;
import com.todolist.api.shared.security.ProblemDetailsSecurityHandler;

@Configuration
public class SecurityConfig {
	private static final String[] PUBLIC_DOCS_AND_HEALTH = {
			"/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**", "/actuator/health/**", "/error"
	};

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http, ProblemDetailsSecurityHandler problemDetailsHandler)
			throws Exception {
		return http
			.csrf(AbstractHttpConfigurer::disable)
			.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
			.authorizeHttpRequests(auth -> auth
				.requestMatchers(HttpMethod.POST, "/api/auth/register", "/api/auth/login").permitAll()
				.requestMatchers(PUBLIC_DOCS_AND_HEALTH).permitAll()
				.requestMatchers("/api/admin/**").hasRole("ADMIN")
				.anyRequest().authenticated())
			.oauth2ResourceServer(oauth2 -> oauth2
				.jwt(jwt -> jwt.jwtAuthenticationConverter(new AuthenticatedUserJwtConverter()))
				.authenticationEntryPoint(problemDetailsHandler)
				.accessDeniedHandler(problemDetailsHandler))
			.exceptionHandling(exceptions -> exceptions
				.authenticationEntryPoint(problemDetailsHandler)
				.accessDeniedHandler(problemDetailsHandler))
			.build();
	}

	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}
}
