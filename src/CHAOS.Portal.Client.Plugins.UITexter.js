if (!jQuery)
	throw "jQuery not loaded";
if(!PortalClient)
	throw "PortalCLient not loaded";

// ******************************** UITexter ********************************

function UITexter(servicePath, objectGUID, email, password)
{
	if(typeof servicePath === "undefined")
		throw "Parameter servicePath must be set";
	if(typeof objectGUID === "undefined")
		throw "Parameter objectGUID must be set";
	
	var _isReady = false;
	var _ready = new PortalEvent(this);
	var self = this;
	
	this._client = new PortalClient(servicePath);
	
	this.ObjectGUID = function() { return objectGUID; };
	this.IsReady = function() { return _isReady; }
	this.Ready = function() { return _ready;}

	this._client.SessionCreated().Add(function (result)
	{ 
		if(typeof email === "string" && email !== "" && typeof password === "string" && password !== "")
		{
			self._client.SessionAuthenticated().Add(function(data) 
			{
				_isReady = true;
				_ready.Raise(); 
			});
			self._client.EmailPassword_Login(null, email, password);
		}
		else
		{
			_isReady = true;
			_ready.Raise();
		}
	});
}

UITexter.prototype = (function()
{
	var languageCodeToUse = null;
	
	function GetMetadata()
	{
		this._client.Object_GetByObjectGUID(ObjectGetCompleted, this.ObjectGUID(), true);
	}
	
	function ObjectGetCompleted(serviceResult)
	{
		if(!serviceResult.WasSuccess() || serviceResult.MCM() == null || !serviceResult.MCM().WasSuccess() || serviceResult.MCM().Results().length == 0)
			throw "Portal error: " + (!serviceResult.WasSuccess() ? serviceResult.Error() : serviceResult.MCM() == null ? "No data returned from MCM" : !serviceResult.MCM().WasSuccess() ? serviceResult.MCM().Error() : "No Objects returned from MCM" );

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
	
	function ReplaceUIText(metadata)
	{
		metadata = $($.parseXML(metadata));

		//Get root node and the its children.
		metadata.children().first().children().each(function ()
		{
			$("." + this.nodeName).text($(this).text());
		})
	}
	
	return {
		constructor: UITexter,
		
		SetLanguage: function(languageCode)
		{
			if(typeof languageCode == "undefined")
				throw "Parameter languageCode must be set";
			
			var wasLanguageCodeSet = languageCode == null;
			languageCodeToUse = languageCode;
			
			if(this.IsReady())
				GetMetadata.call(this);
			else if(!wasLanguageCodeSet)
			{
				var self = this;
				this.Ready().Add(function (result){ GetMetadata.call(self); })
			}
		}
	};
})();