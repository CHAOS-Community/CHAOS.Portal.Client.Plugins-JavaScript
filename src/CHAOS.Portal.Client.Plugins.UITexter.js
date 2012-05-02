if (!jQuery)
	throw "jQuery not loaded";
if(!PortalClient)
	throw "PortalClient not loaded";

// ******************************** UITexter ********************************

PortalClient.RegisterPlugin(function()
{
	function ReplaceUIText(metadata)
	{
		metadata = $($.parseXML(metadata));

		//Get root node and then its children.
		metadata.children().first().children().each(function ()
		{
			$("." + this.nodeName).text($(this).text());
		});
	}
	
	return {
		ApplyMetadata: function(objectGUID, languageCode, schemaGUID, failSilently)
		{
			if(typeof objectGUID === "undefined")
				throw "Parameter objectGUID must be set";
			if(typeof languageCode === "undefined")
				throw "Parameter languageCode must be set";
			
			schemaGUID = typeof schemaGUID !== "undefined" ? schemaGUID : null;
			failSilently = typeof failSilently !== "undefined" ? failSilently : false;
			
			this.Object_GetByObjectGUID(function(serviceResult)
			{
				if(serviceResult.WasSuccess() && serviceResult.MCM().WasSuccess() && serviceResult.MCM().Results().length > 0)
				{
					var object = serviceResult.MCM().Results()[0];
					var foundMetadata = false;

					for(var i = 0; i < object.Metadatas.length; i++)
					{
						if(object.Metadatas[i].LanguageCode == languageCode && (schemaGUID == null || object.Metadatas[i].MetadataSchemaGUID == schemaGUID))
						{
							ReplaceUIText(object.Metadatas[i].MetadataXML);
							foundMetadata = true;
						}
					}
					
					if(!foundMetadata && !failSilently)
						throw "Metadata with languageCode " + languageCode + " not found.";
				}
				else if(!failSilently)
				{
					if(!serviceResult.WasSuccess())
						throw "Service failed with: " + serviceResult.Error();
					else if(!serviceResult.MCM().WasSuccess())
						throw "MCM module failed with: " + serviceResult.MCM().Error();
					else
						throw "Object was not found";
				}
			}, objectGUID, true, false, false );
		}
	}	
});