package isamrs.tim1.controller;

import java.util.Map;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ChangePasswordController {
	@GetMapping("/changePassword")
	public String showChangePasswordPage(Map<String, Object> model){
		return "changePassword/changePassword.html";
	}
}
