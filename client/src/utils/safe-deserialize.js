// used with m.request, avoids crash when the response isn't JSON
// TODO: report the issue on github
export default function safeDeserialize(string) {
  try {
    return JSON.parse(string)
  } catch (e) {
    return string
  }
}
