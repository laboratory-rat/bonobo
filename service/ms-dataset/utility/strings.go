package utility

import (
	"regexp"
	"strconv"
	"unicode"
)

// Is string contains only numbers
func IsContainsOnlyLetters(s string) bool {
	for _, r := range s {
		if !unicode.IsLetter(r) {
			return false
		}
	}
	return true
}

func IntFromString(s string) (int, error) {
	i, err := strconv.Atoi(s)
	if err != nil {
		return 0, err
	}

	return i, nil
}

// Is string contains only numbers and .
var IsStringNumber = regexp.MustCompile(`^[0-9.,-]*$`).MatchString

// Is string contains letters / numbers / _
var IsStringAlphabetic = regexp.MustCompile(`^[a-zA-Z0-9_ ]*$`).MatchString

// Is string contains array of values
var IsStringJsonArray = regexp.MustCompile(`^\[.*\]$`).MatchString

// Is string contains array of numbers
var IsStringJsonArrayNumbers = regexp.MustCompile(`^\[[0-9].*\]$`).MatchString
