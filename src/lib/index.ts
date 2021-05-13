function run() {
  console.log('Hello Serverless Job!')
}

if (require.main === module) {
  void run()
}
