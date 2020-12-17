package utility

import "math"

func RoundNumber(num float64, decimals *int8) float64 {
	var floatDec float64
	if decimals == nil {
		floatDec = 0
	} else {
		floatDec = float64(*decimals)
	}

	pow := float64(math.Pow(10, floatDec))
	return math.Round(num*pow) / pow
}
