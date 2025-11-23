FROM gradle:7.3-jdk11 AS build
WORKDIR /app
COPY . .
RUN ./gradlew shadowJar --no-daemon

FROM openjdk:11-jre-slim
WORKDIR /app
COPY --from=build /app/build/libs/bid-whist-web-app-1.0-SNAPSHOT-all.jar app.jar
EXPOSE 8080
ENV SERVER_HOST=0.0.0.0
ENV SERVER_PORT=8080
CMD ["java", "-jar", "app.jar"]
