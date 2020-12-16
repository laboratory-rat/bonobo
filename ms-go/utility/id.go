package utility

import (
	"github.com/kjk/betterguid"
)

func GenerateRandomId() string {
	return betterguid.New()
}
