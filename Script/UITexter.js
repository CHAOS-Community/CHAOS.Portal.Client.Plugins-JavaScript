if (!jQuery)
	throw "jQuery not loaded";
if(!PortalClient)
	throw "PortalCLient not loaded";

// ******************************** UITexter ********************************

function UITexter(servicePath, objectGUID)
{
	if(typeof servicePath !== "undefined")
		throw "Parameter servicePath must be set";
	if(typeof objectGUID !== "undefined")
		throw "Parameter objectGUID must be set";
	
	var client = new PortalClient(servicePath);
	
	this.ObjectGUID = function() { return objectGUID; };
	this.Client = function() { return client; };
}

UITexter.prototype = (function()
{
	var languageCodeToUse = null;
	
	function GetMetadata()
	{
		client.Object_GetByObjectGUID(ObjectGetCompleted, this.ObjectGUID(), true);
	}
	
	function ObjectGetCompleted(result)
	{
		if(!result.WasSuccess() || result.MCM() == null || !result.MCM().WasSuccess() || result.MCM().Results().length == 0)
			throw "Portal error: " + (!result.WasSuccess() ? result.Error() : result.MCM() == null ? "No data returned from MCM" : !result.MCM().WasSuccess() ? result.MCM().Error() : "No Objects returned from MCM" );

		var object = serviceResult.MCM().Results()[0];
		
		for(var i = 0; i < object.Metadatas.length; i++)
		{
			if(object.Metadatas[i].LanguageCode == languageCodeToUse)
			{
				ReplaceUIText(object.Metadatas[i].MetadataXML);
				return;
			}
		}
			
		throw "Metadata with languageCode " + languageCodeToUse + " not found.";
	}
	
	function ReplaceUIText(meatadata)
	{
		
	}
	
	return {
		constructor: UITexter,
		
		SetLanguage: function(languageCode)
		{
			if(typeof languageCode == "undefined")
				throw "Parameter languageCode must be set";
			
			var wasLanguageCodeSet = languageCode == null;
			languageCodeToUse = languageCode;
			
			if(this.Client().IsSessionCreated())
				GetMetadata.call(this);
			else if(!wasLanguageCodeSet)
				this.Client().SessionCreated().Add(function (result){ GetMetadata.call(this); });
			
		}
	};
})();