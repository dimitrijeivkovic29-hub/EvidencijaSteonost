package com.farm.steonost.repo;

import com.farm.steonost.model.MlekoDnevno;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MlekoDnevnoRepo extends JpaRepository<MlekoDnevno, Long> {
    Optional<MlekoDnevno> findByOwnerUsernameAndDatum(String ownerUsername, LocalDate datum);
    List<MlekoDnevno> findByOwnerUsernameAndDatumBetweenOrderByDatumAsc(String ownerUsername, LocalDate from, LocalDate to);
    List<MlekoDnevno> findByOwnerUsernameOrderByDatumAsc(String ownerUsername);
}
