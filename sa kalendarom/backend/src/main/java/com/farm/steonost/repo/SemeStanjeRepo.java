package com.farm.steonost.repo;

import com.farm.steonost.model.SemeStanje;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SemeStanjeRepo extends JpaRepository<SemeStanje, Long> {
    Optional<SemeStanje> findByBik(String bik);
}
