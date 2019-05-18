package isamrs.tim1.service;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import isamrs.tim1.dto.FlightReservationDTO;
import isamrs.tim1.dto.PassengerDTO;
import isamrs.tim1.model.Flight;
import isamrs.tim1.model.FlightReservation;
import isamrs.tim1.model.PassengerSeat;
import isamrs.tim1.model.PlaneSegment;
import isamrs.tim1.model.PlaneSegmentClass;
import isamrs.tim1.model.RegisteredUser;
import isamrs.tim1.model.Seat;
import isamrs.tim1.model.UserReservation;
import isamrs.tim1.repository.FlightRepository;
import isamrs.tim1.repository.ReservationRepository;
import isamrs.tim1.repository.ServiceRepository;
import isamrs.tim1.repository.UserRepository;
import isamrs.tim1.repository.UserReservationRepository;

@Service
public class ReservationService {
	
	@Autowired
	ReservationRepository reservationRepository;
	
	@Autowired
	FlightRepository flightRepository;
	
	@Autowired
	UserRepository userRepository;
	
	@Autowired
	UserReservationRepository userReservationRepository;
	
	@Autowired
	ServiceRepository serviceRepository;
	
	public FlightReservationDTO reserveFlight(FlightReservationDTO flightRes) {
		FlightReservation fr = new FlightReservation();
		RegisteredUser ru = (RegisteredUser) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
		Flight f = flightRepository.findOneByFlightCode(flightRes.getFlightCode());
		fr.setFlight(f);
		fr.setDone(false);
		fr.setDateOfReservation(new Date());
		int counter = 0;
		double price = 0.0;
		String userPassport = flightRes.getPassengers()[0].getPassport();
		int numOfBags = flightRes.getPassengers()[0].getNumberOfBags();
		ArrayList<PassengerDTO> passengerList = new ArrayList<PassengerDTO>
												(Arrays.asList(Arrays.copyOfRange(flightRes.getPassengers(), 1, flightRes.getPassengers().length)));
		passengerList.add(0, new PassengerDTO(ru.getFirstName(), ru.getLastName(), userPassport, numOfBags));
		for (PassengerDTO p : passengerList) {
			String[] idx = flightRes.getSeats()[counter].split("_");
			price += p.getNumberOfBags() * f.getPricePerBag();
			Seat st = new Seat();
			st.setRow(Integer.parseInt(idx[0]));
			st.setColumn(Integer.parseInt(idx[1]));
			if (idx[2].equalsIgnoreCase(PlaneSegmentClass.FIRST.toString().substring(0, 1))) {
				st.setPlaneSegment(new PlaneSegment(PlaneSegmentClass.FIRST));
				price += f.getFirstClassPrice();
			}
			else if (idx[2].equalsIgnoreCase(PlaneSegmentClass.BUSINESS.toString().substring(0, 1))) {
				st.setPlaneSegment(new PlaneSegment(PlaneSegmentClass.BUSINESS));
				price += f.getBusinessClassPrice();
			}
			else if (idx[2].equalsIgnoreCase(PlaneSegmentClass.ECONOMY.toString().substring(0, 1))) {
				st.setPlaneSegment(new PlaneSegment(PlaneSegmentClass.ECONOMY));
				price += f.getEconomyClassPrice();
			}
			else {
				return null;
			}
			PassengerSeat ps = new PassengerSeat(p, st);
			ps.setNormalReservation(fr);
			fr.getPassengerSeats().add(ps);
			counter++;
		}
		fr.setPrice(price);
		UserReservation ur = new UserReservation();
		ur.setGrade(0);
		ur.setReservation(fr);
		ur.setUser(ru);
		ru.getUserReservations().add(ur);
		fr.setUser(ur);
		f.getAirline().getNormalReservations().add(fr);
		userReservationRepository.save(ur);
		reservationRepository.save(fr);
		userRepository.save(ru);
		String res = f.getStartDestination().getName() + "-" + f.getEndDestination().getName();
		SimpleDateFormat sdf = new SimpleDateFormat("dd.MM.yyyy");
		String date = sdf.format(fr.getDateOfReservation());
		return new FlightReservationDTO(res, date, price, ur.getGrade());
	}
}
