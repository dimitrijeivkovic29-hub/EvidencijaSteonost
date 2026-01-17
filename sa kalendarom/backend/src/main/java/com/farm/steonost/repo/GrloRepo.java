package com.farm.steonost.repo;
import com.farm.steonost.model.Grlo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Collection;

import org.springframework.data.jpa.repository.Query;

public interface GrloRepo extends JpaRepository<Grlo, Long> {
    java.util.Optional<Grlo> findByBrojAndOwnerUsername(String broj, String ownerUsername);
    @Query("select distinct g.ownerUsername from Grlo g")
    java.util.List<String> findDistinctOwners();
    List<Grlo> findByOwnerUsername(String owner);
    List<Grlo> findByBrojInAndOwnerUsername(Collection<String> brojevi, String owner);
    List<Grlo> findByBrojIn(Collection<String> brojevi);
}
