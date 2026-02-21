package logger

import (
	"fmt"
	"os"
	"time"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var log *zap.Logger

func coloredTimeEncoder(t time.Time, enc zapcore.PrimitiveArrayEncoder) {
	enc.AppendString(fmt.Sprintf("\x1b[36m%s\x1b[0m", t.Format("15:04:05 MST")))
}

func coloredCallerEncoder(caller zapcore.EntryCaller, enc zapcore.PrimitiveArrayEncoder) {
	enc.AppendString(fmt.Sprintf("\x1b[35m%s\x1b[0m", caller.String()))
}

func Init() {
	if os.Getenv("APP_ENV") == "development" {
		config := zap.NewDevelopmentConfig()
    //colored logging
		config.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
		config.EncoderConfig.EncodeTime = coloredTimeEncoder
		config.EncoderConfig.EncodeCaller = coloredCallerEncoder
		log = zap.Must(config.Build())
	} else {
		log = zap.Must(zap.NewProduction())
	}
}

func Get() *zap.Logger {
	return log
}

func Sugar() *zap.SugaredLogger {
	return log.Sugar()
}

func Close() error {
	return log.Sync()
}
