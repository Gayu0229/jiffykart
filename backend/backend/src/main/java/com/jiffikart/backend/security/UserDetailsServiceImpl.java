package com.jiffikart.backend.security;

import com.jiffikart.backend.entity.User;
import com.jiffikart.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import java.util.Collections;
import java.util.List;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {
    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        String trimmedIdentifier = identifier.trim();
        User user = userRepository.findFirstByPhoneOrderByIdAsc(trimmedIdentifier)
                .or(() -> userRepository.findByEmailIgnoreCase(trimmedIdentifier))
                .orElseThrow(
                        () -> new UsernameNotFoundException("User Not Found with identifier: " + trimmedIdentifier));

        List<SimpleGrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("ROLE_" + user.getRole().name())
        );

        return org.springframework.security.core.userdetails.User.withUsername(user.getId().toString())
                .password(user.getPassword() != null ? user.getPassword() : "")
                .authorities(authorities)
                .disabled(user.getEnabled() == null || !user.getEnabled())
                .build();
    }
}
