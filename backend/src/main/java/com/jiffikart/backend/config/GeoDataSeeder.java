package com.jiffikart.backend.config;

import com.jiffikart.backend.entity.City;
import com.jiffikart.backend.entity.Zone;
import com.jiffikart.backend.entity.Pincode;
import com.jiffikart.backend.repository.CityRepository;
import com.jiffikart.backend.repository.ZoneRepository;
import com.jiffikart.backend.repository.PincodeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class GeoDataSeeder implements CommandLineRunner {

    @Autowired
    private CityRepository cityRepository;
    
    @Autowired
    private ZoneRepository zoneRepository;
    
    @Autowired
    private PincodeRepository pincodeRepository;

    @Override
    public void run(String... args) throws Exception {
        if (cityRepository.count() == 0) {
            System.out.println("=================================================");
            System.out.println("DEBUG: No cities found. Seeding geographic data manually...");
            
            // Cities
            City chennai = cityRepository.save(City.builder().name("Chennai").build());
            City bengaluru = cityRepository.save(City.builder().name("Bengaluru").build());
            
            // Chennai Zones
            Zone adyar = zoneRepository.save(Zone.builder().city(chennai).name("Adyar").build());
            Zone tnagar = zoneRepository.save(Zone.builder().city(chennai).name("T. Nagar").build());
            Zone annanagar = zoneRepository.save(Zone.builder().city(chennai).name("Anna Nagar").build());
            
            // Chennai Pincodes
            pincodeRepository.save(Pincode.builder().zone(adyar).pincode("600020").build());
            pincodeRepository.save(Pincode.builder().zone(tnagar).pincode("600017").build());
            pincodeRepository.save(Pincode.builder().zone(annanagar).pincode("600040").build());
            
            // Bengaluru Zones
            Zone indiranagar = zoneRepository.save(Zone.builder().city(bengaluru).name("Indiranagar").build());
            Zone koramangala = zoneRepository.save(Zone.builder().city(bengaluru).name("Koramangala").build());
            Zone whitefield = zoneRepository.save(Zone.builder().city(bengaluru).name("Whitefield").build());
            
            // Bengaluru Pincodes
            pincodeRepository.save(Pincode.builder().zone(indiranagar).pincode("560038").build());
            pincodeRepository.save(Pincode.builder().zone(koramangala).pincode("560034").build());
            pincodeRepository.save(Pincode.builder().zone(whitefield).pincode("560066").build());
            
            System.out.println("DEBUG: Manual seeding complete.");
            System.out.println("=================================================");
        } else {
            System.out.println("DEBUG: Geographic data already seeded. Count: " + cityRepository.count());
        }
    }
}
