class ApplicationController < ActionController::Base
	# May Cause CSRF Errors.
	protect_from_forgery with: :exception
end
