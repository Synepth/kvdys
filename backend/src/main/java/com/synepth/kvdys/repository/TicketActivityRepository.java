package com.synepth.kvdys.repository;

import com.synepth.kvdys.entity.TicketActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketActivityRepository extends JpaRepository<TicketActivity, Long> {

    List<TicketActivity> findByTicketIdOrderByCreatedAtDesc(Long ticketId);

    List<TicketActivity> findByTicketId(Long ticketId);
}
