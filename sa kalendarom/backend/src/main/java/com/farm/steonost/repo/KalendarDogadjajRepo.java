package com.farm.steonost.repo;

import com.farm.steonost.model.KalendarDogadjaj;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDate;
import java.util.List;

public interface KalendarDogadjajRepo extends JpaRepository<KalendarDogadjaj, Long> {
    @Query("select e from KalendarDogadjaj e where e.korisnickoIme = ?1 and ((e.datumDogadjaja between ?2 and ?3) or (e.datumPodsetnika between ?2 and ?3)) order by e.datumDogadjaja asc")
    List<KalendarDogadjaj> pronadjiProzor(String korisnik, LocalDate od, LocalDate doDatuma);

    List<KalendarDogadjaj> findByKorisnickoIme(String korisnik);
}