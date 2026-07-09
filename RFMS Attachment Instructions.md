##Authentication

All API methods require a session token. The session token authorizes access to your store database. The session token must be sent with all API requests as the password using HTTP Basic Auth. User name should be set using the same user name you used in the first step.

POST https://api.rfms.online/v2/session/begin


Username
<username>

Password
{{apikey}}


Example Request:
curl --location --request POST 'https://api.rfms.online/v1/session/begin'

Example Response:
{
  "authorized": true,
  "sessionToken": "1598c4a37c1c54552732bb907013176d",
  "sessionExpires": "3/5/2018 7:00:39 PM +00:00"
}


##List Attachments

POST https://api.rfms.online/v2/attachments

Finds attachments based on a variety of user-provided parameters. Said parameter options are defined below:

*Attachment Type, Required Parameters
-Quote Header Order Header Estimate Header, documentNumber documentType

Example Request
curl --location 'https://api.rfms.online/v2/attachments' \
--data '{
    "productId": 123387,
    "isService": true
}'

Example Response
{
  "status": "success",
  "result": [
    {
      "id": 18289,
      "path": "\\\\path\\to\\file\\Image123.png",
      "fileExtension": "png",
      "size": 9053,
      "description": "photo.png",
      "fileData": "base64 encoded file data"
    }
  ],
  "detail": null
}

##Get Attachment

GET https://api.rfms.online/v2/attachment/:id

Retrieve a file attachment. The file is returned as a Base64 encoded string.

Example Request:
curl --location 'https://api.rfms.online/v2/attachment/14003' \
--header 'Content-Type: application/json' \
--data ''


Example Response:
{
  "status": "success",
  "result": "OK",
  "detail": "** BASE64 ENCODED DATA **"
}


##Add Attachment

POST https://api.rfms.online/v2/attachment

Add an attachment to a document or a product.
The following table details the parameters required, if the user wishes to add an attachment to a quote:

*Parameters, Type, Required, Meaning
-documentNumber,	string,	true,	Number of document to which attachment is to be added
-documentType,	string,	true,	Specify if this document is a Quote, Order, Estimate, or Claim
-lineNumber,	number,	false,	If adding attachment to specific quote/order line, specify using this parameter
-fileExtension,	string,	true,	File extension of attachment (jpg,pdf,etc)
-description, string, false, Brief description of attachment contents
-fileData, string, true, Base64 encoded string representing the file
-paperlessDocType, int,	false,	Document type id obtained from Get Paperless Document Types endpoint
-subNumber, int, false,	The estimate sub number. Defaults to 1. Only applies to adding an attachment to an estimate.

