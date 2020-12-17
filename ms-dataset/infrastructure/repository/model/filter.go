package repomodel

type SearchFilter struct {
	StartAfter *string
	Limit      int
	Query      *map[string]string
	OrederBy   *map[string]bool
}

func NewFilter(startAfter *string, limit *int, query *map[string]string, orderBy *map[string]bool) *SearchFilter {
	_defaultLimit := 20
	_limit := &_defaultLimit
	if limit != nil {
		_limit = limit
	}

	return &SearchFilter{
		StartAfter: startAfter,
		Limit:      *_limit,
		Query:      query,
		OrederBy:   orderBy,
	}
}
