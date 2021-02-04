FROM golang:alpine

LABEL version="1.0"
LABEL author="Oleh Tymofeieiev <oleg.timofeev20@gmail.com>"

RUN apk update

WORKDIR /app

COPY .. .
RUN go mod download
RUN go mod vendor
RUN go build -o ./app ./main.go

EXPOSE $BNB_PORT

ENTRYPOINT ["./app"]