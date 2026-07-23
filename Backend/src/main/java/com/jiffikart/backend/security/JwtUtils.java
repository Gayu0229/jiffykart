package com.jiffikart.backend.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;
import java.security.Key;
import java.util.Date;

@Component
public class JwtUtils {
    @org.springframework.beans.factory.annotation.Value("${jiffikart.jwt.secret:bezKoderSecretKeybezKoderSecretKeybezKoderSecretKey}")
    private String jwtSecret;

    @org.springframework.beans.factory.annotation.Value("${jiffikart.jwt.expiration-ms:86400000}")
    private int jwtExpirationMs;

    private Key key;

    @jakarta.annotation.PostConstruct
    public void init() {
        this.key = Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    public String generateJwtToken(String phone, java.util.Map<String, Object> claims) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(phone)
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }
    
    // Overload for backward compatibility if needed, though strictly we should use the one above
    public String generateJwtToken(String phone) {
        return generateJwtToken(phone, new java.util.HashMap<>());
    }

    public String getUserNameFromJwtToken(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build()
                .parseClaimsJws(token).getBody().getSubject();
    }

    public io.jsonwebtoken.Claims extractAllClaims(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build()
                .parseClaimsJws(token).getBody();
    }

    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parse(authToken);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
