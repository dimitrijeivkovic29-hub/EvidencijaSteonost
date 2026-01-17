package com.farm.steonost.repo;
import com.farm.steonost.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DogadjajRepo extends JpaRepository<Dogadjaj, Long> {
    List<Dogadjaj> findByGrloIdOrderByDatumDesc(Long grloId);
    List<Dogadjaj> findByGrloIdAndTipOrderByDatumDesc(Long grloId, TipDogadjaja tip);
    Dogadjaj findFirstByGrloIdAndTipOrderByDatumDesc(Long grloId, TipDogadjaja tip);
    void deleteByGrloId(Long grloId);
}
