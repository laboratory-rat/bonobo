package error

type ServiceError struct {
	Code    int    `json:"code"`
	Reason  string `json:"reason"`
	Message string `json:"message"`
}

func NewServiceError(code int, reason string, message string) *ServiceError {
	return &ServiceError{
		Code:    code,
		Reason:  reason,
		Message: message,
	}
}

func New400(reason string, message string) *ServiceError {
	return NewServiceError(400, reason, message)
}

func New403(reason string, message string) *ServiceError {
	return NewServiceError(403, reason, message)
}
