package com.farm.steonost.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public record IzvestajDTO(
        String vlasnik,
        LocalDate generisano,
        List<MonthCount> ocekivanaTeljenjaPoMesecu,
        Map<String,Integer> teljenjaPoMesecu,
        int zaOsemenjavanje,
        int zaPotvrduSteonosti,
        int brojSteonih,
        int brojOtvorenih,
        int ukupnoGrla,
        java.util.Map<String,Integer> steonostiPoBiku,
        java.util.Map<String,Integer> osemenjavanjaPoBiku
){
    public static record MonthCount(String mesec, int broj) {}
}
